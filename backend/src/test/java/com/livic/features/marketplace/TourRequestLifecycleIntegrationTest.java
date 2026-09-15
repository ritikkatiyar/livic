package com.livic.features.marketplace;

import com.livic.features.marketplace.domain.MarketplaceLeadTbl;
import com.livic.features.marketplace.domain.OtpVerificationTbl;
import com.livic.features.marketplace.dto.MarketplaceLeadDTOs;
import com.livic.features.marketplace.dto.TourRequestDTOs;
import com.livic.features.marketplace.exception.DeclinedTourSlotException;
import com.livic.features.marketplace.exception.DuplicateTourRequestException;
import com.livic.features.marketplace.job.TourRequestLifecycleJob;
import com.livic.features.marketplace.repository.MarketplaceLeadRepository;
import com.livic.features.marketplace.repository.OtpVerificationRepository;
import com.livic.features.marketplace.service.interfaces.MarketplaceLeadService;
import com.livic.features.marketplace.service.interfaces.MyTourRequestService;
import com.livic.features.marketplace.service.interfaces.TourRequestManagementService;
import com.livic.platform.auth.service.interfaces.AuthorizationService;
import com.livic.platform.common.domain.FacingDirection;
import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.domain.LeadType;
import com.livic.platform.common.domain.PropertyType;
import com.livic.platform.common.domain.UnitType;
import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.domain.UnitTbl;
import com.livic.services.property.repository.PropertyRepository;
import com.livic.services.property.repository.UnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/** Tour request lifecycle against MySQL: duplicate rule (service + unique index), landlord decisions, prospect views, job. */
@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class TourRequestLifecycleIntegrationTest {

    private static final String PHONE = "9876512345";

    @Autowired private MarketplaceLeadService leadService;
    @Autowired private TourRequestManagementService managementService;
    @Autowired private MyTourRequestService myTourRequestService;
    @Autowired private TourRequestLifecycleJob lifecycleJob;
    @Autowired private MarketplaceLeadRepository leadRepository;
    @Autowired private OtpVerificationRepository otpRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private UnitRepository unitRepository;

    @MockitoBean private AuthorizationService authorizationService;

    private PropertyTbl property;
    private PropertyTbl otherProperty;
    private UnitTbl unitA;
    private UnitTbl unitB;
    private UnitTbl otherPropertyUnit;
    private String sessionToken;

    @BeforeEach
    void setUp() {
        property = propertyRepository.save(property("Tour Test Residency"));
        otherProperty = propertyRepository.save(property("Other Test Residency"));
        unitA = unitRepository.save(unit(property, "T-101", 0));
        unitB = unitRepository.save(unit(property, "T-102", 1));
        otherPropertyUnit = unitRepository.save(unit(otherProperty, "O-201", 0));

        sessionToken = "livic_otp_session_tour_it_" + UUID.randomUUID().toString().replace("-", "");
        otpRepository.save(OtpVerificationTbl.builder()
                .phone(PHONE)
                .otpCodeHash("$2a$10$dummyHash")
                .sessionToken(sessionToken)
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                .verifiedAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .build());

        when(authorizationService.hasPermission(any(UUID.class), anyString())).thenReturn(true);
    }

    private static PropertyTbl property(String name) {
        return PropertyTbl.builder()
                .name(name)
                .address("1 Test Road")
                .city("Pune")
                .totalFloors(2)
                .propertyType(PropertyType.RENTAL)
                .isActive(true)
                .isPubliclyListed(true)
                .build();
    }

    private static UnitTbl unit(PropertyTbl property, String number, int gridX) {
        return UnitTbl.builder()
                .property(property)
                .unitNumber(number)
                .floor(1)
                .capacity(2)
                .gridX(gridX)
                .gridY(0)
                .type(UnitType.SHARED_UNIT)
                .facing(FacingDirection.EAST)
                .basePrice(new BigDecimal("8000.00"))
                .isBookable(true)
                .build();
    }

    private MarketplaceLeadDTOs.LeadResponse requestTour(PropertyTbl p, UnitTbl u, int daysAhead) {
        return leadService.createLead(p.getId(), u.getId(), new MarketplaceLeadDTOs.CreateLeadRequest(
                LeadType.TOUR_REQUEST, "Tour Tester", PHONE, "tester@example.com",
                Instant.now().plus(daysAhead, ChronoUnit.DAYS), null, null, "MARKETPLACE"), sessionToken);
    }

    @Test
    @DisplayName("A second active tour at the same property is blocked with the existing request; another property is allowed")
    void duplicateRule() {
        MarketplaceLeadDTOs.LeadResponse first = requestTour(property, unitA, 2);

        DuplicateTourRequestException duplicate = assertThrows(DuplicateTourRequestException.class,
                () -> requestTour(property, unitB, 3));
        assertEquals(first.id(), duplicate.getExistingRequest().leadId());
        assertEquals("T-101", duplicate.getExistingRequest().unitNumber());
        assertEquals(LeadStatus.NEW, duplicate.getExistingRequest().status());

        assertNotNull(requestTour(otherProperty, otherPropertyUnit, 2).id());
    }

    @Test
    @DisplayName("Rejecting or cancelling a tour frees the phone to request again at that property")
    void closedToursDoNotBlock() {
        UUID landlordId = UUID.randomUUID();
        MarketplaceLeadDTOs.LeadResponse first = requestTour(property, unitA, 2);
        TourRequestDTOs.LandlordTourRequestResponse rejected = managementService.reject(first.id(), landlordId, "Not available that day");
        assertEquals(LeadStatus.REJECTED, rejected.status());

        MarketplaceLeadDTOs.LeadResponse second = requestTour(property, unitB, 3);
        TourRequestDTOs.MyTourRequestResponse cancelled = myTourRequestService.cancelMyTourRequest(sessionToken, second.id());
        assertEquals(LeadStatus.CANCELLED, cancelled.status());

        MarketplaceLeadDTOs.LeadResponse third = requestTour(property, unitA, 4);
        managementService.approve(third.id(), landlordId);

        // Approved tours are still active and keep blocking
        assertThrows(DuplicateTourRequestException.class, () -> requestTour(property, unitB, 5));
    }

    private MarketplaceLeadDTOs.LeadResponse requestTourAt(UnitTbl u, Instant slot) {
        return leadService.createLead(property.getId(), u.getId(), new MarketplaceLeadDTOs.CreateLeadRequest(
                LeadType.TOUR_REQUEST, "Tour Tester", PHONE, null, slot, null, null, "MARKETPLACE"), sessionToken);
    }

    @Test
    @DisplayName("After a rejection the same slot is refused (even for another unit) but a different slot is accepted")
    void declinedSlotCannotBeRequestedAgain() {
        Instant slot = Instant.now().plus(3, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        MarketplaceLeadDTOs.LeadResponse first = requestTourAt(unitA, slot);
        managementService.reject(first.id(), UUID.randomUUID(), "Not available at that time");

        DeclinedTourSlotException declined = assertThrows(DeclinedTourSlotException.class, () -> requestTourAt(unitB, slot));
        assertEquals(slot, declined.getDeclinedSlot());

        assertEquals(List.of(slot), myTourRequestService.listDeclinedSlots(sessionToken, property.getId()).slots());
        assertTrue(myTourRequestService.listDeclinedSlots(sessionToken, otherProperty.getId()).slots().isEmpty());

        assertNotNull(requestTourAt(unitA, slot.plus(1, ChronoUnit.HOURS)).id());
    }

    @Test
    @DisplayName("An active tour whose visit time passed is closed when the phone requests again")
    void pastActiveTourIsClosedOnCreate() {
        MarketplaceLeadTbl pastPending = leadRepository.saveAndFlush(MarketplaceLeadTbl.builder()
                .propertyId(property.getId())
                .unitId(unitA.getId())
                .leadType(LeadType.TOUR_REQUEST)
                .status(LeadStatus.NEW)
                .prospectName("Tour Tester")
                .prospectPhone(PHONE)
                .preferredSlot(Instant.now().minus(2, ChronoUnit.HOURS))
                .build());

        MarketplaceLeadDTOs.LeadResponse fresh = requestTour(property, unitB, 1);

        assertEquals(LeadStatus.NEW, fresh.status());
        assertEquals(LeadStatus.EXPIRED, leadRepository.findById(pastPending.getId()).orElseThrow().getStatus());
    }

    @Test
    @DisplayName("Landlord filters, summary counts, prospect list and the lifecycle job agree")
    void landlordAndProspectViews() {
        UUID landlordId = UUID.randomUUID();
        MarketplaceLeadDTOs.LeadResponse pending = requestTour(property, unitA, 2);
        MarketplaceLeadDTOs.LeadResponse approvedElsewhere = requestTour(otherProperty, otherPropertyUnit, 3);
        managementService.approve(approvedElsewhere.id(), landlordId);

        PageRequest page = PageRequest.of(0, 20);
        assertEquals(List.of(pending.id()), managementService
                .listTourRequests(property.getId(), TourRequestDTOs.TourRequestFilter.PENDING, page)
                .map(TourRequestDTOs.LandlordTourRequestResponse::id).getContent());
        assertEquals(1, managementService.listTourRequests(otherProperty.getId(), TourRequestDTOs.TourRequestFilter.UPCOMING, page).getTotalElements());
        assertEquals(new TourRequestDTOs.TourRequestSummaryResponse(1, 0), managementService.getSummary(property.getId()));

        List<TourRequestDTOs.MyTourRequestResponse> mine = myTourRequestService.listMyTourRequests(sessionToken, page).getContent();
        assertEquals(2, mine.size());
        assertTrue(mine.stream().allMatch(TourRequestDTOs.MyTourRequestResponse::cancellable));

        // Move both visits into the past; the job then expires the pending one and completes the approved one
        List<MarketplaceLeadTbl> leads = leadRepository.findAllById(List.of(pending.id(), approvedElsewhere.id()));
        leads.forEach(l -> l.setPreferredSlot(Instant.now().minus(1, ChronoUnit.HOURS)));
        leadRepository.saveAllAndFlush(leads);

        lifecycleJob.closePastTourRequests();

        assertEquals(LeadStatus.EXPIRED, leadRepository.findById(pending.id()).orElseThrow().getStatus());
        assertEquals(LeadStatus.COMPLETED, leadRepository.findById(approvedElsewhere.id()).orElseThrow().getStatus());
        assertEquals(1, managementService.listTourRequests(property.getId(), TourRequestDTOs.TourRequestFilter.PAST, page).getTotalElements());
        assertEquals(new TourRequestDTOs.TourRequestSummaryResponse(0, 0), managementService.getSummary(property.getId()));
    }

    @Test
    @DisplayName("The database rejects two active tours for the same phone at the same property")
    void uniqueIndexBackstop() {
        leadRepository.saveAndFlush(activeTour(unitA));

        assertThrows(DataIntegrityViolationException.class, () -> leadRepository.saveAndFlush(activeTour(unitB)));
    }

    private MarketplaceLeadTbl activeTour(UnitTbl unit) {
        return MarketplaceLeadTbl.builder()
                .propertyId(property.getId())
                .unitId(unit.getId())
                .leadType(LeadType.TOUR_REQUEST)
                .status(LeadStatus.NEW)
                .prospectName("Tour Tester")
                .prospectPhone(PHONE)
                .preferredSlot(Instant.now().plus(1, ChronoUnit.DAYS))
                .build();
    }
}
