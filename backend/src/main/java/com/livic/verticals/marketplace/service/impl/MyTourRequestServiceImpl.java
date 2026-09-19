package com.livic.verticals.marketplace.service.impl;

import com.livic.verticals.marketplace.domain.MarketplaceLeadTbl;
import com.livic.verticals.marketplace.dto.TourRequestDTOs.MyTourRequestResponse;
import com.livic.verticals.marketplace.mapper.TourRequestMapper;
import com.livic.verticals.marketplace.repository.MarketplaceLeadRepository;
import com.livic.verticals.marketplace.service.interfaces.MyTourRequestService;
import com.livic.verticals.marketplace.service.interfaces.OtpService;
import com.livic.platform.common.domain.LeadType;
import com.livic.platform.common.exception.BusinessException;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.property.facade.UnitFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MyTourRequestServiceImpl implements MyTourRequestService {

    private static final int MAX_PAGE_SIZE = 50;

    private final MarketplaceLeadRepository leadRepository;
    private final OtpService otpService;
    private final PropertyFacade propertyFacade;
    private final UnitFacade unitFacade;

    @Override
    @Transactional(readOnly = true)
    public Page<MyTourRequestResponse> listMyTourRequests(String sessionToken, Pageable pageable) {
        // The phone always comes from the verified OTP session, never from the request
        String phone = otpService.resolveVerifiedPhone(sessionToken);
        Instant now = Instant.now();

        Pageable page = PageRequest.of(pageable.getPageNumber(), Math.min(Math.max(pageable.getPageSize(), 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<MarketplaceLeadTbl> leads = leadRepository.findByProspectPhoneAndLeadType(phone, LeadType.TOUR_REQUEST, page);

        Set<UUID> propertyIds = leads.getContent().stream().map(MarketplaceLeadTbl::getPropertyId).collect(Collectors.toSet());
        Set<UUID> unitIds = leads.getContent().stream().map(MarketplaceLeadTbl::getUnitId).collect(Collectors.toSet());
        Map<UUID, PropertySummaryDTO> properties = propertyFacade.getPropertiesByIds(propertyIds);
        Map<UUID, UnitSummaryDTO> units = unitFacade.getUnitsByIds(unitIds);

        return leads.map(lead -> TourRequestMapper.toMyResponse(
                lead,
                properties.get(lead.getPropertyId()),
                units.containsKey(lead.getUnitId()) ? units.get(lead.getUnitId()).unitNumber() : null,
                now));
    }

    @Override
    @Transactional
    public MyTourRequestResponse cancelMyTourRequest(String sessionToken, UUID leadId) {
        String phone = otpService.resolveVerifiedPhone(sessionToken);
        Instant now = Instant.now();

        MarketplaceLeadTbl lead = leadRepository.findById(leadId)
                .filter(MarketplaceLeadTbl::isTourRequest)
                // Someone else's request looks exactly like a missing one
                .filter(l -> phone.equals(l.getProspectPhone()))
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Tour request not found"));

        lead.cancelByProspect(now);
        leadRepository.saveAndFlush(lead);
        log.info("tour_request_cancelled_by_prospect leadId={} propertyId={}", leadId, lead.getPropertyId());

        PropertySummaryDTO property = propertyFacade.getPropertiesByIds(Set.of(lead.getPropertyId())).get(lead.getPropertyId());
        String unitNumber = unitFacade.getUnitById(lead.getUnitId()).map(UnitSummaryDTO::unitNumber).orElse(null);
        return TourRequestMapper.toMyResponse(lead, property, unitNumber, now);
    }

}
