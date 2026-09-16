package com.livic.features.marketplace;

import com.livic.features.marketplace.domain.MarketplaceLeadTbl;
import com.livic.features.marketplace.domain.OtpVerificationTbl;
import com.livic.features.marketplace.dto.MarketplaceLeadDTOs;
import com.livic.features.marketplace.dto.TourRequestDTOs;
import com.livic.features.marketplace.dto.TourAvailabilityDTOs;
import com.livic.features.marketplace.exception.DuplicateTourRequestException;
import com.livic.features.marketplace.exception.TourSlotUnavailableException;
import com.livic.features.marketplace.service.interfaces.TourAvailabilityService;
import com.livic.features.marketplace.slots.TourSlotCalculator;
import com.livic.platform.common.exception.BusinessException;
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
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
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
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    @Autowired private MarketplaceLeadService leadService;
    @Autowired private TourAvailabilityService availabilityService;
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

    /** 11:00 property time, {@code daysAhead} days from today: always a bookable slot under the default hours. */
    private static Instant slotAt(int daysAhead, int hour) {
        return LocalDate.now(IST).plusDays(daysAhead).atTime(hour, 0).atZone(IST).toInstant();
    }

    private MarketplaceLeadDTOs.LeadResponse requestTour(PropertyTbl p, UnitTbl u, int daysAhead) {
        return requestTour(p, u, slotAt(daysAhead, 11), PHONE, sessionToken);
    }

    private MarketplaceLeadDTOs.LeadResponse requestTour(PropertyTbl p, UnitTbl u, Instant slot, String phone, String token) {
        return leadService.createLead(p.getId(), u.getId(), new MarketplaceLeadDTOs.CreateLeadRequest(
                LeadType.TOUR_REQUEST, "Tour Tester", phone, "tester@example.com", slot, null, null, "MARKETPLACE"), token);
    }

    private String verifiedSession(String phone) {
        String token = "livic_otp_session_tour_it_" + UUID.randomUUID().toString().replace("-", "");
        otpRepository.save(OtpVerificationTbl.builder()
                .phone(phone)
                .otpCodeHash("$2a$10$dummyHash")
                .sessionToken(token)
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                .verifiedAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .build());
        return token;
    }

    private static TourAvailabilityDTOs.UpdateTourAvailabilityRequest weekdayMornings(Integer maxVisitorsPerSlot) {
        List<TourAvailabilityDTOs.DayHours> hours = java.util.Arrays.stream(DayOfWeek.values())
                .map(day -> new TourAvailabilityDTOs.DayHours(day, day.getValue() <= 5
                        ? List.of(new TourAvailabilityDTOs.TimeWindow(LocalTime.of(10, 0), LocalTime.of(12, 0)))
                        : List.of()))
                .toList();
        return new TourAvailabilityDTOs.UpdateTourAvailabilityRequest(30, 60, 14, maxVisitorsPerSlot, "Asia/Kolkata", hours);
    }

    /** First weekday at least {@code minDaysAhead} days from today, in property time. */
    private static LocalDate nextWeekday(int minDaysAhead) {
        LocalDate date = LocalDate.now(IST).plusDays(minDaysAhead);
        while (date.getDayOfWeek().getValue() > 5) {
            date = date.plusDays(1);
        }
        return date;
    }

    @Test
    @DisplayName("Custom hours: only their slots are bookable, capacity fills a slot, blocked dates close it, and the public slots agree")
    void customVisitingHours() {
        LocalDate day = nextWeekday(2);
        availabilityService.updateAvailability(property.getId(), weekdayMornings(1), UUID.randomUUID());

        // 10:30 is a 30-minute slot now; 11 AM on a weekend or 3 PM on a weekday is outside the hours
        Instant tenThirty = day.atTime(10, 30).atZone(IST).toInstant();
        assertNotNull(requestTour(property, unitA, tenThirty, PHONE, sessionToken).id());
        TourSlotUnavailableException outside = assertThrows(TourSlotUnavailableException.class, () -> requestTour(
                property, unitB, day.atTime(15, 0).atZone(IST).toInstant(), "9876500099", verifiedSession("9876500099")));
        assertEquals(TourSlotUnavailableException.Reason.UNAVAILABLE, outside.getReason());

        // One visitor per slot: a second phone can't take 10:30 but can take 11:00
        String otherPhone = "9876512399";
        String otherToken = verifiedSession(otherPhone);
        assertEquals(TourSlotUnavailableException.Reason.FULL, assertThrows(TourSlotUnavailableException.class,
                () -> requestTour(property, unitB, tenThirty, otherPhone, otherToken)).getReason());

        TourAvailabilityDTOs.TourSlotsResponse slots = availabilityService.getTourSlots(property.getId(), null);
        TourAvailabilityDTOs.TourSlotDay slotDay = slots.days().stream().filter(d -> d.date().equals(day)).findFirst().orElseThrow();
        assertEquals(List.of(LocalTime.of(10, 0), LocalTime.of(10, 30), LocalTime.of(11, 0), LocalTime.of(11, 30)),
                slotDay.slots().stream().map(TourAvailabilityDTOs.TourSlot::localTime).toList());
        assertEquals(TourSlotCalculator.SlotStatus.FULL, slotDay.slots().get(1).status());
        assertTrue(slots.days().stream().filter(d -> d.dayOfWeek().getValue() > 5).allMatch(TourAvailabilityDTOs.TourSlotDay::closed));

        // Block 11:00-12:00 that day: 11:00 is no longer bookable
        availabilityService.addBlackout(property.getId(), new TourAvailabilityDTOs.CreateBlackoutRequest(
                day, LocalTime.of(11, 0), LocalTime.of(12, 0), "Plumber visit"), UUID.randomUUID());
        assertEquals(TourSlotUnavailableException.Reason.UNAVAILABLE, assertThrows(TourSlotUnavailableException.class,
                () -> requestTour(property, unitB, day.atTime(11, 0).atZone(IST).toInstant(), otherPhone, otherToken)).getReason());
        assertNotNull(requestTour(property, unitB, day.atTime(10, 0).atZone(IST).toInstant(), otherPhone, otherToken).id());
    }

    @Test
    @DisplayName("Changing hours keeps existing requests but flags the ones now outside the hours")
    void changedHoursFlagExistingRequests() {
        LocalDate saturday = LocalDate.now(IST).plusDays(2).with(java.time.temporal.TemporalAdjusters.nextOrSame(DayOfWeek.SATURDAY));
        MarketplaceLeadDTOs.LeadResponse weekendVisit = requestTour(property, unitA, saturday.atTime(11, 0).atZone(IST).toInstant(), PHONE, sessionToken);

        availabilityService.updateAvailability(property.getId(), weekdayMornings(null), UUID.randomUUID());

        TourRequestDTOs.LandlordTourRequestResponse row = managementService
                .listTourRequests(property.getId(), TourRequestDTOs.TourRequestFilter.PENDING, PageRequest.of(0, 20))
                .getContent().getFirst();
        assertEquals(weekendVisit.id(), row.id());
        assertEquals(LeadStatus.NEW, row.status());
        assertTrue(row.outsideVisitingHours());
    }

    @Test
    @DisplayName("Invalid visiting hours are rejected with a clear message")
    void invalidHoursRejected() {
        List<TourAvailabilityDTOs.DayHours> overlapping = List.of(new TourAvailabilityDTOs.DayHours(DayOfWeek.MONDAY, List.of(
                new TourAvailabilityDTOs.TimeWindow(LocalTime.of(10, 0), LocalTime.of(12, 0)),
                new TourAvailabilityDTOs.TimeWindow(LocalTime.of(11, 0), LocalTime.of(13, 0)))));
        BusinessException ex = assertThrows(BusinessException.class, () -> availabilityService.updateAvailability(property.getId(),
                new TourAvailabilityDTOs.UpdateTourAvailabilityRequest(60, 60, 14, null, null, overlapping), UUID.randomUUID()));
        assertEquals("Time windows on Monday overlap", ex.getMessage());

        List<TourAvailabilityDTOs.DayHours> offStep = List.of(new TourAvailabilityDTOs.DayHours(DayOfWeek.MONDAY, List.of(
                new TourAvailabilityDTOs.TimeWindow(LocalTime.of(10, 15), LocalTime.of(12, 0)))));
        assertThrows(BusinessException.class, () -> availabilityService.updateAvailability(property.getId(),
                new TourAvailabilityDTOs.UpdateTourAvailabilityRequest(45, 60, 14, null, null, offStep), UUID.randomUUID()));

        assertFalse(availabilityService.getAvailability(property.getId()).customized());
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

    @Test
    @DisplayName("After a rejection the same slot is refused (even for another unit) but a different slot is accepted")
    void declinedSlotCannotBeRequestedAgain() {
        Instant slot = slotAt(3, 11);
        MarketplaceLeadDTOs.LeadResponse first = requestTour(property, unitA, slot, PHONE, sessionToken);
        managementService.reject(first.id(), UUID.randomUUID(), "Not available at that time");

        TourSlotUnavailableException declined = assertThrows(TourSlotUnavailableException.class,
                () -> requestTour(property, unitB, slot, PHONE, sessionToken));
        assertEquals(TourSlotUnavailableException.Reason.DECLINED, declined.getReason());
        assertEquals(slot, declined.getSlot());

        // The public slot list marks it for this phone only
        assertTrue(availabilityService.getTourSlots(property.getId(), sessionToken).days().stream()
                .flatMap(d -> d.slots().stream())
                .anyMatch(s -> s.start().equals(slot) && s.status() == TourSlotCalculator.SlotStatus.DECLINED));
        assertTrue(availabilityService.getTourSlots(property.getId(), null).days().stream()
                .flatMap(d -> d.slots().stream())
                .anyMatch(s -> s.start().equals(slot) && s.status() == TourSlotCalculator.SlotStatus.AVAILABLE));

        assertNotNull(requestTour(property, unitA, slotAt(3, 12), PHONE, sessionToken).id());
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
