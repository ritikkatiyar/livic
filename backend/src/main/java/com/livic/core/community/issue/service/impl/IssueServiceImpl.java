package com.livic.core.community.issue.service.impl;

import com.livic.platform.auth.dto.MembershipSummaryDTO;
import com.livic.platform.auth.facade.AuthFacade;
import com.livic.platform.common.constant.StaffPermission;
import com.livic.platform.common.enums.AccessType;
import com.livic.platform.common.event.IssueCreatedEvent;
import com.livic.platform.common.event.IssueEscalatedEvent;
import com.livic.platform.common.exception.BusinessException;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.core.community.issue.domain.IssueEscalationStatus;
import com.livic.core.community.issue.domain.IssueStatus;
import com.livic.core.community.issue.domain.IssueTbl;
import com.livic.core.community.issue.domain.IssueTimelineEntryType;
import com.livic.core.community.issue.domain.IssueTimelineTbl;
import com.livic.core.community.issue.dto.IssueDTOs.CreateIssueRequest;
import com.livic.core.community.issue.dto.IssueDTOs.IssueResponse;
import com.livic.core.community.issue.dto.IssueDTOs.UpdateStatusRequest;
import com.livic.core.community.issue.mapper.IssueMapper;
import com.livic.core.community.issue.service.interfaces.EscalationStrategy;
import com.livic.core.community.issue.service.interfaces.IssueCrudService;
import com.livic.core.community.issue.service.interfaces.IssueService;
import com.livic.core.community.issue.service.interfaces.IssueTimelineCrudService;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.property.facade.UnitFacade;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class IssueServiceImpl implements IssueService {

    private final IssueCrudService issueCrudService;
    private final IssueTimelineCrudService issueTimelineCrudService;
    private final UnitMemberFacade unitMemberFacade;
    private final AuthFacade authFacade;
    private final PropertyFacade propertyFacade;
    private final UnitFacade unitFacade;
    private final UserFacade userFacade;
    private final List<EscalationStrategy> escalationStrategies;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public IssueResponse createIssue(CreateIssueRequest request, UUID callerUserId) {
        UUID propertyId = request.propertyId();
        UUID tenantId = null;
        UUID leaseId = request.leaseId();
        UUID unitId = request.unitId();

        boolean isStaff = hasStaffPermission(callerUserId, propertyId, StaffPermission.ISSUE_MANAGE);
        
        if (!isStaff) {
            // A resident of the property: owner, tenant or family member.
            List<UnitResidentDTO> residences = unitMemberFacade.getActiveResidencesByUserId(callerUserId);
            if (residences.isEmpty()) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Caller does not live in any unit");
            }
            UUID requestedUnitId = request.unitId();
            UnitResidentDTO residence = residences.stream()
                    .filter(r -> propertyId.equals(r.propertyId()))
                    .filter(r -> requestedUnitId == null || requestedUnitId.equals(r.unitId()))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException(HttpStatus.FORBIDDEN, "Caller does not live in the selected property"));

            tenantId = callerUserId;
            leaseId = residence.leaseId();
            unitId = residence.unitId();
        } else {
            // Staff caller
            if (request.tenantId() != null) {
                tenantId = request.tenantId();
            }
        }

        IssueTbl issue = IssueMapper.toEntity(request, callerUserId, tenantId);
        // Overwrite resolved values
        issue.setLeaseId(leaseId);
        issue.setUnitId(unitId);
        issue.setTenantId(tenantId);
        if (!isStaff) {
            issue.setScope(com.livic.core.community.issue.domain.IssueScope.UNIT);
        }
        issue.setStatus(IssueStatus.OPEN);
        issue.setEscalationStatus(IssueEscalationStatus.NONE);
        issue.setEscalationLevel(0);

        IssueTbl saved = issueCrudService.save(issue);

        // Check if any strategy triggers immediate escalation (like SAFETY)
        boolean immediatelyEscalated = false;
        for (EscalationStrategy strategy : escalationStrategies) {
            if (strategy instanceof SafetyEmergencyStrategy && strategy.shouldEscalate(saved)) {
                saved.setEscalationStatus(IssueEscalationStatus.ESCALATED);
                saved.setEscalationLevel(saved.getEscalationLevel() + 1);
                saved = issueCrudService.save(saved);

                IssueTimelineTbl escalationTimeline = IssueTimelineTbl.builder()
                        .issue(saved)
                        .authorUserId(callerUserId)
                        .entryType(IssueTimelineEntryType.ESCALATION)
                        .content("Safety emergency automatically escalated immediately on creation.")
                        .build();
                issueTimelineCrudService.save(escalationTimeline);
                immediatelyEscalated = true;
                break;
            }
        }

        // Fetch property details for notifications
        String propName = propertyFacade.getPropertyById(propertyId).map(PropertySummaryDTO::name).orElse("Property");
        String unitNumber = unitId != null ? unitFacade.getUnitById(unitId).map(UnitSummaryDTO::unitNumber).orElse("Common Area") : "Common Area";
        String creatorName = userFacade.getUserById(callerUserId).map(UserSummaryDTO::fullName).orElse("User");

        if (immediatelyEscalated) {
            publishEscalationNotifications(saved, propName, unitNumber, "Safety emergency triggered automatic immediate escalation");
        } else {
            publishCreatedNotifications(saved, propName, unitNumber, creatorName);
        }

        return getIssueResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<IssueResponse> listIssues(UUID callerUserId, Pageable pageable) {
        List<UUID> staffPropertyIds = authFacade.getEffectivePermissionCodes(callerUserId).entrySet().stream()
                .filter(e -> e.getValue().contains(StaffPermission.ISSUE_VIEW.name()))
                .map(Map.Entry::getKey)
                .toList();

        Page<IssueTbl> issuesPage;
        if (!staffPropertyIds.isEmpty()) {
            issuesPage = issueCrudService.findByPropertyIdIn(staffPropertyIds, pageable);
        } else {
            List<UUID> myUnitIds = unitMemberFacade.getActiveResidencesByUserId(callerUserId).stream()
                    .map(UnitResidentDTO::unitId)
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();
            issuesPage = myUnitIds.isEmpty()
                    ? Page.empty(pageable)
                    : issueCrudService.findByUnitIdIn(myUnitIds, pageable);
        }

        // Pre-fetch names to prevent N+1 queries
        Set<UUID> userIds = new HashSet<>();
        issuesPage.getContent().forEach(i -> {
            if (i.getReportedByUserId() != null) userIds.add(i.getReportedByUserId());
            if (i.getTenantId() != null) userIds.add(i.getTenantId());
        });

        Map<UUID, UserSummaryDTO> usersMap = userIds.isEmpty() ? Collections.emptyMap() : userFacade.getUsersByIds(userIds);
        Map<UUID, String> authorNamesMap = usersMap.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().fullName()));

        return issuesPage.map(issue -> {
            List<IssueTimelineTbl> timeline = issueTimelineCrudService.findByIssueIdOrderByCreatedAtAsc(issue.getId());
            timeline.forEach(t -> userIds.add(t.getAuthorUserId()));
            Map<UUID, UserSummaryDTO> fullUsersMap = userIds.isEmpty() ? Collections.emptyMap() : userFacade.getUsersByIds(userIds);
            Map<UUID, String> fullAuthorNamesMap = fullUsersMap.entrySet().stream()
                    .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().fullName()));
            return IssueMapper.toResponse(issue, timeline, fullAuthorNamesMap);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public IssueResponse getIssue(UUID issueId, UUID callerUserId) {
        IssueTbl issue = issueCrudService.findById(issueId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Issue not found"));

        checkIssueAccess(issue, callerUserId, StaffPermission.ISSUE_VIEW);
        return getIssueResponse(issue);
    }

    @Override
    @Transactional
    public IssueResponse addComment(UUID issueId, String content, UUID callerUserId) {
        IssueTbl issue = issueCrudService.findById(issueId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Issue not found"));

        checkIssueAccess(issue, callerUserId, StaffPermission.ISSUE_VIEW);

        IssueTimelineTbl commentTimeline = IssueTimelineTbl.builder()
                .issue(issue)
                .authorUserId(callerUserId)
                .entryType(IssueTimelineEntryType.COMMENT)
                .content(content)
                .build();
        issueTimelineCrudService.save(commentTimeline);

        return getIssueResponse(issue);
    }

    @Override
    @Transactional
    public IssueResponse updateStatus(UUID issueId, UpdateStatusRequest request, UUID callerUserId) {
        IssueTbl issue = issueCrudService.findById(issueId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Issue not found"));

        checkIssueAccess(issue, callerUserId, StaffPermission.ISSUE_MANAGE);

        IssueStatus oldStatus = issue.getStatus();
        issue.setStatus(request.status());
        IssueTbl saved = issueCrudService.save(issue);

        String changeContent = "Status changed from " + oldStatus + " to " + request.status();
        if (request.comment() != null && !request.comment().trim().isEmpty()) {
            changeContent += ". Comment: " + request.comment().trim();
        }

        IssueTimelineTbl statusTimeline = IssueTimelineTbl.builder()
                .issue(saved)
                .authorUserId(callerUserId)
                .entryType(IssueTimelineEntryType.STATUS_CHANGE)
                .content(changeContent)
                .build();
        issueTimelineCrudService.save(statusTimeline);

        return getIssueResponse(saved);
    }

    @Override
    @Transactional
    public IssueResponse escalateIssue(UUID issueId, String reason, UUID callerUserId) {
        IssueTbl issue = issueCrudService.findById(issueId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Issue not found"));

        checkIssueAccess(issue, callerUserId, StaffPermission.ISSUE_MANAGE);

        issue.setEscalationStatus(IssueEscalationStatus.ESCALATED);
        issue.setEscalationLevel(issue.getEscalationLevel() + 1);
        IssueTbl saved = issueCrudService.save(issue);

        IssueTimelineTbl escalationTimeline = IssueTimelineTbl.builder()
                .issue(saved)
                .authorUserId(callerUserId)
                .entryType(IssueTimelineEntryType.ESCALATION)
                .content(reason)
                .build();
        issueTimelineCrudService.save(escalationTimeline);

        String propName = propertyFacade.getPropertyById(saved.getPropertyId()).map(PropertySummaryDTO::name).orElse("Property");
        String unitNumber = saved.getUnitId() != null ? unitFacade.getUnitById(saved.getUnitId()).map(UnitSummaryDTO::unitNumber).orElse("Common Area") : "Common Area";

        publishEscalationNotifications(saved, propName, unitNumber, reason);

        return getIssueResponse(saved);
    }

    @Override
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void runDailyEscalationJob() {
        log.info("[IssueSlaJob] Running SLA auto-escalation check...");
        List<IssueTbl> openIssues = issueCrudService.findByStatusInAndEscalationStatus(
                Arrays.asList(IssueStatus.OPEN, IssueStatus.IN_PROGRESS),
                IssueEscalationStatus.NONE
        );

        for (IssueTbl issue : openIssues) {
            for (EscalationStrategy strategy : escalationStrategies) {
                if (strategy.shouldEscalate(issue)) {
                    log.info("[IssueSlaJob] Escalating issue '{}' ({}) via strategy {}", issue.getTitle(), issue.getId(), strategy.getClass().getSimpleName());
                    issue.setEscalationStatus(IssueEscalationStatus.ESCALATED);
                    issue.setEscalationLevel(issue.getEscalationLevel() + 1);
                    IssueTbl saved = issueCrudService.save(issue);

                    IssueTimelineTbl escalationTimeline = IssueTimelineTbl.builder()
                            .issue(saved)
                            .authorUserId(UUID.fromString("00000000-0000-0000-0000-000000000000")) // System User
                            .entryType(IssueTimelineEntryType.ESCALATION)
                            .content("SLA auto-escalation triggered by " + strategy.getClass().getSimpleName() + ".")
                            .build();
                    issueTimelineCrudService.save(escalationTimeline);

                    String propName = propertyFacade.getPropertyById(saved.getPropertyId()).map(PropertySummaryDTO::name).orElse("Property");
                    String unitNumber = saved.getUnitId() != null ? unitFacade.getUnitById(saved.getUnitId()).map(UnitSummaryDTO::unitNumber).orElse("Common Area") : "Common Area";

                    publishEscalationNotifications(saved, propName, unitNumber, "SLA auto-escalation triggered by " + strategy.getClass().getSimpleName());
                    break;
                }
            }
        }
    }

    private void publishCreatedNotifications(IssueTbl issue, String propName, String unitNumber, String creatorName) {
        List<MembershipSummaryDTO> memberships = authFacade.getMembershipsByPropertyId(issue.getPropertyId()).stream()
                .filter(MembershipSummaryDTO::isActive)
                .toList();
        Map<UUID, Set<String>> customCodes = authFacade.getPermissionsByMembershipIds(memberships.stream()
                .filter(m -> !AccessType.FULL_ACCESS.equals(m.accessType()))
                .map(MembershipSummaryDTO::id)
                .toList());
        List<String> staffUserIds = memberships.stream()
                .filter(m -> AccessType.FULL_ACCESS.equals(m.accessType())
                        || customCodes.getOrDefault(m.id(), Set.of()).contains(StaffPermission.ISSUE_VIEW.name()))
                .map(m -> m.userId().toString())
                .distinct()
                .toList();

        for (String recipientId : staffUserIds) {
            IssueCreatedEvent event = new IssueCreatedEvent(
                    this,
                    issue.getId().toString(),
                    propName,
                    unitNumber,
                    creatorName,
                    issue.getTitle(),
                    issue.getDescription(),
                    recipientId
            );
            eventPublisher.publishEvent(event);
        }
    }

    private void publishEscalationNotifications(IssueTbl issue, String propName, String unitNumber, String reason) {
        List<MembershipSummaryDTO> memberships = authFacade.getMembershipsByPropertyId(issue.getPropertyId());
        List<String> escalationUserIds = memberships.stream()
                .filter(m -> AccessType.FULL_ACCESS.equals(m.accessType()))
                .map(m -> m.userId().toString())
                .distinct()
                .toList();

        for (String recipientId : escalationUserIds) {
            IssueEscalatedEvent event = new IssueEscalatedEvent(
                    this,
                    issue.getId().toString(),
                    propName,
                    unitNumber,
                    issue.getTitle(),
                    reason,
                    recipientId
            );
            eventPublisher.publishEvent(event);
        }
    }

    private IssueResponse getIssueResponse(IssueTbl issue) {
        List<IssueTimelineTbl> timeline = issueTimelineCrudService.findByIssueIdOrderByCreatedAtAsc(issue.getId());
        Set<UUID> userIds = new HashSet<>();
        if (issue.getReportedByUserId() != null) userIds.add(issue.getReportedByUserId());
        if (issue.getTenantId() != null) userIds.add(issue.getTenantId());
        timeline.forEach(t -> userIds.add(t.getAuthorUserId()));

        Map<UUID, UserSummaryDTO> usersMap = userIds.isEmpty() ? Collections.emptyMap() : userFacade.getUsersByIds(userIds);
        Map<UUID, String> authorNamesMap = usersMap.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().fullName()));

        return IssueMapper.toResponse(issue, timeline, authorNamesMap);
    }

    private void checkIssueAccess(IssueTbl issue, UUID userId, StaffPermission staffPermission) {
        if (hasStaffPermission(userId, issue.getPropertyId(), staffPermission)) {
            return;
        }
        boolean livesInTheUnit = issue.getUnitId() != null
                && unitMemberFacade.getActiveResidencesByUserId(userId).stream()
                        .anyMatch(residence -> issue.getUnitId().equals(residence.unitId()));
        if (livesInTheUnit) {
            return;
        }
        throw new BusinessException(HttpStatus.FORBIDDEN, "Access Denied");
    }

    private boolean hasStaffPermission(UUID userId, UUID propertyId, StaffPermission permission) {
        return authFacade.getEffectivePermissionCodes(userId)
                .getOrDefault(propertyId, Set.of())
                .contains(permission.name());
    }
}
