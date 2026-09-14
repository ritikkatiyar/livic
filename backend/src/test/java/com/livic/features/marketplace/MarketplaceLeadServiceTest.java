package com.livic.features.marketplace;

import com.livic.platform.common.domain.FacingDirection;
import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.domain.LeadType;
import com.livic.platform.common.domain.PropertyType;
import com.livic.platform.common.domain.UnitType;
import com.livic.platform.common.exception.BusinessException;
import com.livic.features.marketplace.domain.MarketplaceLeadTbl;
import com.livic.features.marketplace.dto.MarketplaceLeadDTOs;
import com.livic.features.marketplace.exception.DuplicateTourRequestException;
import com.livic.features.marketplace.repository.MarketplaceLeadRepository;
import com.livic.features.marketplace.service.impl.MarketplaceLeadServiceImpl;
import com.livic.features.marketplace.service.interfaces.OtpService;
import com.livic.platform.payment.dto.PaymentTransactionResponse;
import com.livic.platform.payment.facade.PaymentFacade;
import com.livic.services.property.dto.PublicPropertyListingDTO;
import com.livic.services.property.dto.UnitListingDTO;
import com.livic.services.property.facade.PropertyFacade;
import com.livic.services.property.facade.UnitFacade;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MarketplaceLeadServiceTest {

    @Mock
    private MarketplaceLeadRepository leadRepository;

    @Mock
    private PropertyFacade propertyFacade;

    @Mock
    private UnitFacade unitFacade;

    @Mock
    private OtpService otpService;

    @Mock
    private PaymentFacade paymentFacade;

    @InjectMocks
    private MarketplaceLeadServiceImpl leadService;

    private UUID propId;
    private UUID unitId;
    private PublicPropertyListingDTO property;
    private UnitListingDTO bookableUnit;
    private UnitListingDTO unbookableUnit;

    private final String sessionToken = "livic_otp_session_12345";
    private final String prospectPhone = "9876543210";

    @BeforeEach
    public void setUp() {
        propId = UUID.randomUUID();
        unitId = UUID.randomUUID();

        property = new PublicPropertyListingDTO(
                propId, "Green Park Residency", "500 Green Avenue", "Hyderabad", null, 4,
                PropertyType.RENTAL, null, List.of(), null);

        bookableUnit = new UnitListingDTO(
                unitId, propId, "201", 2, 2, UnitType.STUDIO, FacingDirection.NORTH,
                new BigDecimal("18000.00"), true, null, List.of());

        unbookableUnit = new UnitListingDTO(
                UUID.randomUUID(), propId, "202", 2, 2, UnitType.STUDIO, FacingDirection.SOUTH,
                new BigDecimal("18000.00"), false, null, List.of());
    }

    private MarketplaceLeadDTOs.CreateLeadRequest bookingRequest() {
        return new MarketplaceLeadDTOs.CreateLeadRequest(
                LeadType.BOOKING,
                "Jane Doe",
                prospectPhone,
                "jane@example.com",
                null,
                LocalDate.now().plusDays(5),
                null,
                "MARKETPLACE"
        );
    }

    @Test
    @DisplayName("Create Lead - Success for bookable unit")
    public void testCreateLeadBookingSuccess() {
        doNothing().when(otpService).validateSessionToken(sessionToken, prospectPhone);
        when(propertyFacade.getPublicListing(propId)).thenReturn(Optional.of(property));
        when(unitFacade.getUnitListingById(unitId)).thenReturn(Optional.of(bookableUnit));
        when(leadRepository.saveAndFlush(any(MarketplaceLeadTbl.class))).thenAnswer(i -> {
            MarketplaceLeadTbl lead = i.getArgument(0);
            lead.setId(UUID.randomUUID());
            return lead;
        });

        MarketplaceLeadDTOs.LeadResponse response = leadService.createLead(propId, unitId, bookingRequest(), sessionToken);

        assertNotNull(response);
        assertEquals(LeadType.BOOKING, response.leadType());
        assertEquals(LeadStatus.NEW, response.status());
        assertEquals("Jane Doe", response.prospectName());
        assertEquals(propId, response.propertyId());
        assertEquals(unitId, response.unitId());
        assertEquals(new BigDecimal("2000.00"), response.tokenAmount());
    }

    @Test
    @DisplayName("Create Lead - Fails when unit is unbookable for instant booking")
    public void testCreateLeadUnbookableFailure() {
        UUID unbookableId = unbookableUnit.id();
        doNothing().when(otpService).validateSessionToken(sessionToken, prospectPhone);
        when(propertyFacade.getPublicListing(propId)).thenReturn(Optional.of(property));
        when(unitFacade.getUnitListingById(unbookableId)).thenReturn(Optional.of(unbookableUnit));

        BusinessException ex = assertThrows(BusinessException.class, () ->
                leadService.createLead(propId, unbookableId, bookingRequest(), sessionToken));

        assertTrue(ex.getMessage().contains("not available for instant booking"));
        verify(leadRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Create Lead - Fails when property is not publicly listed")
    public void testCreateLeadUnlistedPropertyFailure() {
        doNothing().when(otpService).validateSessionToken(sessionToken, prospectPhone);
        when(propertyFacade.getPublicListing(propId)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () ->
                leadService.createLead(propId, unitId, bookingRequest(), sessionToken));

        verify(leadRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Create Lead - Fails when unit belongs to another property")
    public void testCreateLeadUnitPropertyMismatch() {
        UnitListingDTO foreignUnit = new UnitListingDTO(
                unitId, UUID.randomUUID(), "999", 1, 1, UnitType.STUDIO, FacingDirection.EAST,
                new BigDecimal("10000.00"), true, null, List.of());
        doNothing().when(otpService).validateSessionToken(sessionToken, prospectPhone);
        when(propertyFacade.getPublicListing(propId)).thenReturn(Optional.of(property));
        when(unitFacade.getUnitListingById(unitId)).thenReturn(Optional.of(foreignUnit));

        BusinessException ex = assertThrows(BusinessException.class, () ->
                leadService.createLead(propId, unitId, bookingRequest(), sessionToken));

        assertTrue(ex.getMessage().contains("does not belong"));
        verify(leadRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Initiate Token Payment - Success")
    public void testInitiateTokenPaymentSuccess() {
        UUID leadId = UUID.randomUUID();
        MarketplaceLeadTbl lead = MarketplaceLeadTbl.builder()
                .propertyId(propId)
                .unitId(unitId)
                .leadType(LeadType.BOOKING)
                .status(LeadStatus.NEW)
                .prospectName("Jane Doe")
                .prospectPhone(prospectPhone)
                .tokenAmount(new BigDecimal("2000.00"))
                .build();
        lead.setId(leadId);

        when(leadRepository.findById(leadId)).thenReturn(Optional.of(lead));

        UUID txId = UUID.randomUUID();
        PaymentTransactionResponse tx = new PaymentTransactionResponse(
                txId, leadId, "ONLINE", "MARKETPLACE_LEAD", leadId, "RAZORPAY", "order_razorpay_123",
                new BigDecimal("2000.00"), "PENDING", null, null, null, null, null);

        when(paymentFacade.initiateOnlinePaymentTransaction(eq(leadId), eq("MARKETPLACE_LEAD"), eq(leadId), eq(new BigDecimal("2000.00"))))
                .thenReturn(tx);

        MarketplaceLeadDTOs.TokenPaymentInitResponse response = leadService.initiateTokenPayment(leadId);

        assertNotNull(response);
        assertEquals(leadId, response.leadId());
        assertEquals(txId, response.transactionId());
        assertEquals("order_razorpay_123", response.razorpayOrderId());
        assertEquals(new BigDecimal("2000.00"), response.amount());
        assertEquals("INR", response.currency());
        assertEquals(txId, lead.getPaymentTransactionId());
    }

    private MarketplaceLeadDTOs.CreateLeadRequest tourRequest() {
        return new MarketplaceLeadDTOs.CreateLeadRequest(
                LeadType.TOUR_REQUEST,
                "Jane Doe",
                prospectPhone,
                "jane@example.com",
                Instant.now().plus(2, ChronoUnit.DAYS),
                null,
                null,
                "MARKETPLACE"
        );
    }

    private MarketplaceLeadTbl existingTour(LeadStatus status, Instant slot) {
        MarketplaceLeadTbl tour = MarketplaceLeadTbl.builder()
                .propertyId(propId)
                .unitId(unitId)
                .leadType(LeadType.TOUR_REQUEST)
                .status(status)
                .prospectName("Jane Doe")
                .prospectPhone(prospectPhone)
                .preferredSlot(slot)
                .build();
        tour.setId(UUID.randomUUID());
        return tour;
    }

    private void stubValidTourContext() {
        doNothing().when(otpService).validateSessionToken(sessionToken, prospectPhone);
        when(propertyFacade.getPublicListing(propId)).thenReturn(Optional.of(property));
        when(unitFacade.getUnitListingById(unitId)).thenReturn(Optional.of(bookableUnit));
    }

    @Test
    @DisplayName("Create Tour - Blocked with the existing request when the phone has an active tour at the property")
    public void testCreateTourBlockedByActiveTour() {
        stubValidTourContext();
        MarketplaceLeadTbl active = existingTour(LeadStatus.APPROVED, Instant.now().plus(1, ChronoUnit.DAYS));
        when(leadRepository.findByPropertyIdAndProspectPhoneAndLeadTypeAndStatusIn(
                eq(propId), eq(prospectPhone), eq(LeadType.TOUR_REQUEST), anyCollection()))
                .thenReturn(List.of(active));

        DuplicateTourRequestException ex = assertThrows(DuplicateTourRequestException.class, () ->
                leadService.createLead(propId, unitId, tourRequest(), sessionToken));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals(active.getId(), ex.getExistingRequest().leadId());
        assertEquals(LeadStatus.APPROVED, ex.getExistingRequest().status());
        assertEquals("201", ex.getExistingRequest().unitNumber());
        verify(leadRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Create Tour - A past-dated active tour is closed and no longer blocks a new request")
    public void testCreateTourClosesPastTour() {
        stubValidTourContext();
        MarketplaceLeadTbl pastPending = existingTour(LeadStatus.NEW, Instant.now().minus(1, ChronoUnit.HOURS));
        when(leadRepository.findByPropertyIdAndProspectPhoneAndLeadTypeAndStatusIn(
                eq(propId), eq(prospectPhone), eq(LeadType.TOUR_REQUEST), anyCollection()))
                .thenReturn(List.of(pastPending));
        when(leadRepository.saveAndFlush(any(MarketplaceLeadTbl.class))).thenAnswer(i -> i.getArgument(0));

        MarketplaceLeadDTOs.LeadResponse response = leadService.createLead(propId, unitId, tourRequest(), sessionToken);

        assertEquals(LeadStatus.EXPIRED, pastPending.getStatus());
        assertEquals(LeadType.TOUR_REQUEST, response.leadType());
        assertEquals(LeadStatus.NEW, response.status());
        verify(leadRepository, times(2)).saveAndFlush(any(MarketplaceLeadTbl.class));
    }

    @Test
    @DisplayName("Create Tour - A concurrent duplicate caught by the unique index becomes a 409")
    public void testCreateTourConcurrentDuplicate() {
        stubValidTourContext();
        when(leadRepository.findByPropertyIdAndProspectPhoneAndLeadTypeAndStatusIn(any(), any(), any(), anyCollection()))
                .thenReturn(List.of());
        when(leadRepository.saveAndFlush(any(MarketplaceLeadTbl.class)))
                .thenThrow(new DataIntegrityViolationException("Duplicate entry for key 'uq_marketplace_lead_active_tour'"));

        DuplicateTourRequestException ex = assertThrows(DuplicateTourRequestException.class, () ->
                leadService.createLead(propId, unitId, tourRequest(), sessionToken));

        assertNull(ex.getExistingRequest());
    }

    @Test
    @DisplayName("Lead Status - Public lookup omits the prospect's contact details and reports the effective status")
    public void testGetLeadStatusIsPiiFree() {
        MarketplaceLeadTbl pastApproved = existingTour(LeadStatus.APPROVED, Instant.now().minus(1, ChronoUnit.HOURS));
        when(leadRepository.findById(pastApproved.getId())).thenReturn(Optional.of(pastApproved));

        MarketplaceLeadDTOs.LeadStatusResponse status = leadService.getLeadStatus(pastApproved.getId());

        assertEquals(LeadStatus.COMPLETED, status.status());
        assertTrue(java.util.Arrays.stream(MarketplaceLeadDTOs.LeadStatusResponse.class.getRecordComponents())
                .map(java.lang.reflect.RecordComponent::getName)
                .noneMatch(name -> name.startsWith("prospect")));
    }
}
