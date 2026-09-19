package com.livic.features.announcement.service;

import com.livic.features.announcement.domain.*;
import com.livic.features.announcement.dto.AnnouncementDTOs.CreateAnnouncementRequest;
import com.livic.features.announcement.dto.AnnouncementDTOs.AnnouncementResponse;
import com.livic.features.announcement.mapper.AnnouncementMapper;
import com.livic.features.announcement.service.interfaces.AnnouncementService;
import com.livic.platform.common.event.AnnouncementBroadcastEvent;
import com.livic.services.property.dto.PropertySummaryDTO;
import com.livic.services.property.dto.UnitSummaryDTO;
import com.livic.services.property.facade.PropertyFacade;
import com.livic.services.property.dto.UnitResidentDTO;
import com.livic.services.property.facade.UnitFacade;
import com.livic.services.property.facade.UnitMemberFacade;
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
    private final UnitMemberFacade unitMemberFacade;
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

        // Recipients are the property's unit members — owners, tenants and family alike.
        List<UnitResidentDTO> residents = unitMemberFacade.getActiveResidentsByPropertyId(propSummary.id());
        List<String> recipientUserIds = getRecipientUserIds(
                request.getTargetType(), request.getTargetFloorNumber(), request.getTargetUnitId(), residents);

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
        // Where this person lives, whether they own the flat, rent it, or live with someone who does.
        UnitResidentDTO residence = unitMemberFacade.getActiveResidencesByUserId(tenantUserId).stream()
                .filter(r -> r.propertyId() != null)
                .findFirst()
                .orElse(null);

        if (residence == null) {
            return Page.empty(pageable);
        }

        UUID propertyId = residence.propertyId();
        Integer floor = residence.floor() != null ? residence.floor() : 0;
        UUID unitId = residence.unitId();

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

        // Fetched once and grouped in memory, instead of a query per announcement.
        List<UnitResidentDTO> residents = unitMemberFacade.getActiveResidentsByPropertyId(propertyId);

        List<UUID> creatorIds = announcements.getContent().stream()
                .map(AnnouncementTbl::getCreatorId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<UUID, UserSummaryDTO> creatorsMap = creatorIds.isEmpty() ? Collections.emptyMap() : userFacade.getUsersByIds(new HashSet<>(creatorIds));

        return announcements.map(announcement -> {
            long readCount = readCountsMap.getOrDefault(announcement.getId(), 0L);
            List<String> recipients = getRecipientUserIds(
                    announcement.getTargetType(), announcement.getTargetFloorNumber(), announcement.getTargetUnitId(), residents);
            long totalRecipients = recipients.size();
            UserSummaryDTO creator = creatorsMap.get(announcement.getCreatorId());
            String creatorName = creator != null ? creator.fullName() : "System";

            return AnnouncementMapper.toResponse(announcement, creatorName, false, readCount, totalRecipients);
        });
    }

    /** Who a notice reaches: every active member of the targeted property, floor or unit. */
    private List<String> getRecipientUserIds(AnnouncementTargetType targetType, Integer targetFloorNumber,
                                             UUID targetUnitId, List<UnitResidentDTO> residents) {
        return residents.stream()
                .filter(resident -> resident.userId() != null)
                .filter(resident -> switch (targetType) {
                    case PROPERTY -> true;
                    case FLOOR -> targetFloorNumber != null && targetFloorNumber.equals(resident.floor());
                    case UNIT -> targetUnitId != null && targetUnitId.equals(resident.unitId());
                })
                .map(resident -> resident.userId().toString())
                .distinct()
                .collect(Collectors.toList());
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

