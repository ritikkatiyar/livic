package com.livic.features.announcement.service;

import com.livic.features.announcement.domain.*;
import com.livic.features.announcement.dto.AnnouncementDTOs.CreateAnnouncementRequest;
import com.livic.features.announcement.dto.AnnouncementDTOs.AnnouncementResponse;
import com.livic.features.announcement.mapper.AnnouncementMapper;
import com.livic.features.announcement.service.interfaces.AnnouncementService;
import com.livic.platform.common.event.AnnouncementBroadcastEvent;
import com.livic.services.finance.dto.LeaseSummaryDTO;
import com.livic.services.finance.facade.FinanceFacade;
import com.livic.services.property.dto.PropertySummaryDTO;
import com.livic.services.property.dto.UnitSummaryDTO;
import com.livic.services.property.facade.PropertyFacade;
import com.livic.services.property.facade.UnitFacade;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import com.livic.features.announcement.service.interfaces.AnnouncementCrudService;
import com.livic.features.announcement.service.interfaces.AnnouncementReceiptCrudService;
import com.livic.platform.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementCrudService announcementCrudService;
    private final AnnouncementReceiptCrudService announcementReceiptCrudService;
    private final PropertyFacade propertyFacade;
    private final UnitFacade unitFacade;
    private final UserFacade userFacade;
    private final FinanceFacade financeFacade;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public AnnouncementResponse createAnnouncement(CreateAnnouncementRequest request, UUID creatorId) {
        PropertySummaryDTO propSummary = propertyFacade.getPropertyById(request.getPropertyId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Property not found"));
        UserSummaryDTO userSummary = userFacade.getUserById(creatorId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));

        AnnouncementTbl announcement = AnnouncementMapper.toEntity(request, propSummary.id(), creatorId);

        announcement = announcementCrudService.save(announcement);

        // Fetch recipients — pre-fetch all property leases for the optimized path
        List<LeaseSummaryDTO> allActivePropertyLeases = financeFacade.getActiveLeasesByPropertyId(propSummary.id());
        Map<UUID, List<LeaseSummaryDTO>> leasesByUnit = allActivePropertyLeases.stream()
                .filter(l -> l.unitId() != null)
                .collect(Collectors.groupingBy(LeaseSummaryDTO::unitId));
        Map<Integer, List<LeaseSummaryDTO>> leasesByFloor = allActivePropertyLeases.stream()
                .filter(l -> l.floor() != null)
                .collect(Collectors.groupingBy(LeaseSummaryDTO::floor));
        List<String> recipientUserIds = getRecipientUserIdsOptimized(
                request.getTargetType(), request.getTargetFloorNumber(), request.getTargetUnitId(), allActivePropertyLeases, leasesByUnit, leasesByFloor);

        // Publish Spring Event to trigger Notification module listeners
        AnnouncementBroadcastEvent event = new AnnouncementBroadcastEvent(
                this,
                announcement.getId().toString(),
                announcement.getTitle(),
                announcement.getContent(),
                announcement.getCategory().name(),
                announcement.getSeverity().name(),
                recipientUserIds
        );
        eventPublisher.publishEvent(event);

        return AnnouncementMapper.toResponse(announcement, userSummary.fullName(), false, 0L, (long) recipientUserIds.size());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AnnouncementResponse> getNoticesForTenant(UUID tenantUserId, Pageable pageable) {
        LeaseSummaryDTO activeLease = financeFacade.getActiveLeaseForUser(tenantUserId).orElse(null);

        if (activeLease == null || activeLease.propertyId() == null) {
            return Page.empty(pageable);
        }

        UUID propertyId = activeLease.propertyId();
        Integer floor = activeLease.floor() != null ? activeLease.floor() : 0;
        UUID unitId = activeLease.unitId();

        Page<AnnouncementTbl> announcements = announcementCrudService.findNoticesForTenant(propertyId, floor, unitId, pageable);

        // Fetch receipts in bulk for the current page's announcements to avoid N+1 queries in loop
        List<UUID> announcementIds = announcements.getContent().stream().map(AnnouncementTbl::getId).toList();
        
        Set<UUID> readAnnouncementIds = new HashSet<>();
        if (!announcementIds.isEmpty()) {
            readAnnouncementIds = announcementReceiptCrudService.findByUserIdAndAnnouncementIdIn(tenantUserId, announcementIds)
                    .stream()
                    .map(r -> r.getAnnouncement().getId())
                    .collect(Collectors.toSet());
        }

        List<UUID> creatorIds = announcements.getContent().stream()
                .map(AnnouncementTbl::getCreatorId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<UUID, UserSummaryDTO> creatorsMap = creatorIds.isEmpty() ? Collections.emptyMap() : userFacade.getUsersByIds(new HashSet<>(creatorIds));

        final Set<UUID> finalReadAnnouncementIds = readAnnouncementIds;

        return announcements.map(announcement -> {
            boolean isRead = finalReadAnnouncementIds.contains(announcement.getId());
            UserSummaryDTO creator = creatorsMap.get(announcement.getCreatorId());
            String creatorName = creator != null ? creator.fullName() : "System";
            return AnnouncementMapper.toResponse(announcement, creatorName, isRead, null, null);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AnnouncementResponse> getAnnouncements(UUID userId, UUID propertyId, Pageable pageable) {
        if (propertyId != null) {
            return getAnnouncementsForProperty(propertyId, userId, pageable);
        }
        return getNoticesForTenant(userId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AnnouncementResponse> getAnnouncementsForProperty(UUID propertyId, UUID userWithAccessId, Pageable pageable) {
        Page<AnnouncementTbl> announcements = announcementCrudService.findByPropertyId(propertyId, pageable);

        List<UUID> announcementIds = announcements.getContent().stream().map(AnnouncementTbl::getId).toList();

        // Optimized: Fetch read counts in bulk for these announcements
        Map<UUID, Long> readCountsMap = new HashMap<>();
        if (!announcementIds.isEmpty()) {
            List<Object[]> countResults = announcementReceiptCrudService.countReceiptsByAnnouncementIdIn(announcementIds);
            for (Object[] row : countResults) {
                readCountsMap.put((UUID) row[0], (Long) row[1]);
            }
        }

        // Optimized: Fetch all active property leases once to group in memory instead of executing DB queries in loop
        List<LeaseSummaryDTO> allActivePropertyLeases = financeFacade.getActiveLeasesByPropertyId(propertyId);
        Map<UUID, List<LeaseSummaryDTO>> leasesByUnit = allActivePropertyLeases.stream()
                .filter(l -> l.unitId() != null)
                .collect(Collectors.groupingBy(LeaseSummaryDTO::unitId));
        Map<Integer, List<LeaseSummaryDTO>> leasesByFloor = allActivePropertyLeases.stream()
                .filter(l -> l.floor() != null)
                .collect(Collectors.groupingBy(LeaseSummaryDTO::floor));

        List<UUID> creatorIds = announcements.getContent().stream()
                .map(AnnouncementTbl::getCreatorId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<UUID, UserSummaryDTO> creatorsMap = creatorIds.isEmpty() ? Collections.emptyMap() : userFacade.getUsersByIds(new HashSet<>(creatorIds));

        return announcements.map(announcement -> {
            long readCount = readCountsMap.getOrDefault(announcement.getId(), 0L);
            List<String> recipients = getRecipientUserIdsOptimized(
                    announcement.getTargetType(), announcement.getTargetFloorNumber(), announcement.getTargetUnitId(), allActivePropertyLeases, leasesByUnit, leasesByFloor);
            long totalRecipients = recipients.size();
            UserSummaryDTO creator = creatorsMap.get(announcement.getCreatorId());
            String creatorName = creator != null ? creator.fullName() : "System";

            return AnnouncementMapper.toResponse(announcement, creatorName, false, readCount, totalRecipients);
        });
    }

    private List<String> getRecipientUserIdsOptimized(AnnouncementTargetType targetType, Integer targetFloorNumber, UUID targetUnitId, 
                                                      List<LeaseSummaryDTO> allActivePropertyLeases, 
                                                      Map<UUID, List<LeaseSummaryDTO>> leasesByUnit, 
                                                      Map<Integer, List<LeaseSummaryDTO>> leasesByFloor) {
        List<String> recipientUserIds = new ArrayList<>();
        if (targetType == AnnouncementTargetType.PROPERTY) {
            for (LeaseSummaryDTO lease : allActivePropertyLeases) {
                if (lease.userId() != null) {
                    recipientUserIds.add(lease.userId().toString());
                }
            }
        } else if (targetType == AnnouncementTargetType.FLOOR) {
            if (targetFloorNumber != null) {
                List<LeaseSummaryDTO> floorLeases = leasesByFloor.getOrDefault(targetFloorNumber, List.of());
                for (LeaseSummaryDTO lease : floorLeases) {
                    if (lease.userId() != null) {
                        recipientUserIds.add(lease.userId().toString());
                    }
                }
            }
        } else if (targetType == AnnouncementTargetType.UNIT) {
            if (targetUnitId != null) {
                List<LeaseSummaryDTO> unitLeases = leasesByUnit.getOrDefault(targetUnitId, List.of());
                for (LeaseSummaryDTO lease : unitLeases) {
                    if (lease.userId() != null) {
                        recipientUserIds.add(lease.userId().toString());
                    }
                }
            }
        }
        return recipientUserIds.stream().distinct().collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markAsRead(UUID announcementId, UUID tenantUserId) {
        AnnouncementTbl announcement = announcementCrudService.findById(announcementId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Announcement not found"));

        boolean alreadyRead = announcementReceiptCrudService.existsByAnnouncementIdAndUserId(announcementId, tenantUserId);
        if (!alreadyRead) {
            AnnouncementReceiptTbl receipt = AnnouncementReceiptTbl.builder()
                    .announcement(announcement)
                    .userId(tenantUserId)
                    .build();
            announcementReceiptCrudService.save(receipt);
        }
    }

}

