package com.livic.features.marketplace.service.impl;

import com.livic.features.marketplace.domain.MarketplaceLeadTbl;
import com.livic.features.marketplace.dto.TourRequestDTOs.LandlordTourRequestResponse;
import com.livic.features.marketplace.dto.TourRequestDTOs.TourRequestFilter;
import com.livic.features.marketplace.dto.TourRequestDTOs.TourRequestSummaryResponse;
import com.livic.features.marketplace.mapper.TourRequestMapper;
import com.livic.features.marketplace.repository.MarketplaceLeadRepository;
import com.livic.features.marketplace.service.interfaces.TourAvailabilityService;
import com.livic.features.marketplace.service.interfaces.TourRequestManagementService;
import com.livic.features.marketplace.slots.TourSchedule;
import com.livic.platform.auth.service.interfaces.AuthorizationService;
import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.exception.BusinessException;
import com.livic.services.property.dto.UnitSummaryDTO;
import com.livic.services.property.facade.UnitFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TourRequestManagementServiceImpl implements TourRequestManagementService {

    private static final int MAX_PAGE_SIZE = 50;

    private final MarketplaceLeadRepository leadRepository;
    private final UnitFacade unitFacade;
    private final AuthorizationService authorizationService;
    private final TourAvailabilityService tourAvailabilityService;

    @Override
    @Transactional(readOnly = true)
    public Page<LandlordTourRequestResponse> listTourRequests(
            UUID propertyId,
            TourRequestFilter filter,
            Pageable pageable
    ) {
        Instant now = Instant.now();
        // Ordering is fixed by each query (soonest first for upcoming, latest first for past)
        Pageable page = PageRequest.of(pageable.getPageNumber(), Math.min(Math.max(pageable.getPageSize(), 1), MAX_PAGE_SIZE));

        Page<MarketplaceLeadTbl> leads = switch (filter) {
            case PENDING -> leadRepository.findUpcomingTours(propertyId, LeadStatus.NEW, now, page);
            case UPCOMING -> leadRepository.findUpcomingTours(propertyId, LeadStatus.APPROVED, now, page);
            case PAST -> leadRepository.findPastTours(propertyId, now, page);
        };

        Set<UUID> unitIds = leads.getContent().stream().map(MarketplaceLeadTbl::getUnitId).collect(Collectors.toSet());
        Map<UUID, UnitSummaryDTO> units = unitFacade.getUnitsByIds(unitIds);
        TourSchedule visitingHours = tourAvailabilityService.getSchedule(propertyId);

        return leads.map(lead -> TourRequestMapper.toLandlordResponse(lead, unitNumberOf(units, lead.getUnitId()), visitingHours, now));
    }

    @Override
    @Transactional(readOnly = true)
    public TourRequestSummaryResponse getSummary(UUID propertyId) {
        Instant now = Instant.now();
        return new TourRequestSummaryResponse(
                leadRepository.countUpcomingTours(propertyId, LeadStatus.NEW, now),
                leadRepository.countUpcomingTours(propertyId, LeadStatus.APPROVED, now)
        );
    }

    @Override
    @Transactional
    public LandlordTourRequestResponse approve(UUID leadId, UUID landlordUserId) {
        MarketplaceLeadTbl lead = getAuthorizedTourRequest(leadId);
        Instant now = Instant.now();

        lead.approve(landlordUserId, now);
        leadRepository.saveAndFlush(lead);
        log.info("tour_request_approved leadId={} propertyId={} landlordUserId={}", leadId, lead.getPropertyId(), landlordUserId);

        return toResponse(lead, now);
    }

    @Override
    @Transactional
    public LandlordTourRequestResponse reject(UUID leadId, UUID landlordUserId, String note) {
        MarketplaceLeadTbl lead = getAuthorizedTourRequest(leadId);
        Instant now = Instant.now();

        lead.reject(landlordUserId, note, now);
        leadRepository.saveAndFlush(lead);
        log.info("tour_request_rejected leadId={} propertyId={} landlordUserId={}", leadId, lead.getPropertyId(), landlordUserId);

        return toResponse(lead, now);
    }

    @Override
    @Transactional
    public int closePastTourRequests() {
        Instant now = Instant.now();
        // updated_at is a LocalDateTime column (BaseEntity), so the bulk update sets it with the same type
        LocalDateTime updatedAt = LocalDateTime.now();

        int expired = leadRepository.closePastTours(LeadStatus.NEW, LeadStatus.EXPIRED, now, updatedAt);
        int completed = leadRepository.closePastTours(LeadStatus.APPROVED, LeadStatus.COMPLETED, now, updatedAt);

        if (expired > 0 || completed > 0) {
            log.info("tour_request_lifecycle_closed expired={} completed={}", expired, completed);
        }
        return expired + completed;
    }

    private MarketplaceLeadTbl getAuthorizedTourRequest(UUID leadId) {
        MarketplaceLeadTbl lead = leadRepository.findById(leadId)
                .filter(MarketplaceLeadTbl::isTourRequest)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Tour request not found"));

        if (!authorizationService.hasPermission(lead.getPropertyId(), "LEASE_UPDATE")) {
            // Same answer for "not yours" and "no permission" so lead ids of other properties cannot be probed
            throw new BusinessException(HttpStatus.FORBIDDEN, "Access Denied");
        }
        return lead;
    }

    private LandlordTourRequestResponse toResponse(MarketplaceLeadTbl lead, Instant now) {
        String unitNumber = unitFacade.getUnitById(lead.getUnitId()).map(UnitSummaryDTO::unitNumber).orElse(null);
        return TourRequestMapper.toLandlordResponse(lead, unitNumber, tourAvailabilityService.getSchedule(lead.getPropertyId()), now);
    }

    private static String unitNumberOf(Map<UUID, UnitSummaryDTO> units, UUID unitId) {
        UnitSummaryDTO unit = units.get(unitId);
        return unit != null ? unit.unitNumber() : null;
    }
}
