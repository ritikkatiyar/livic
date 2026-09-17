package com.livic.features.marketplace;

import com.livic.features.marketplace.domain.MarketplaceLeadTbl;
import com.livic.features.marketplace.dto.TourRequestDTOs;
import com.livic.features.marketplace.repository.MarketplaceLeadRepository;
import com.livic.features.marketplace.service.impl.MyTourRequestServiceImpl;
import com.livic.features.marketplace.service.impl.TourRequestManagementServiceImpl;
import com.livic.features.marketplace.service.interfaces.OtpService;
import com.livic.features.marketplace.service.interfaces.TourAvailabilityService;
import com.livic.features.marketplace.slots.TourSchedule;
import com.livic.platform.auth.service.interfaces.AuthorizationService;
import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.domain.LeadType;
import com.livic.platform.common.domain.UnitType;
import com.livic.platform.common.exception.BusinessException;
import com.livic.services.property.dto.PropertySummaryDTO;
import com.livic.services.property.dto.UnitSummaryDTO;
import com.livic.services.property.facade.PropertyFacade;
import com.livic.services.property.facade.UnitFacade;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class TourRequestServicesTest {

    private static final String PHONE = "9876543210";

    private static MarketplaceLeadTbl tour(UUID propertyId, UUID unitId, LeadStatus status, Instant slot) {
        MarketplaceLeadTbl lead = MarketplaceLeadTbl.builder()
                .propertyId(propertyId)
                .unitId(unitId)
                .leadType(LeadType.TOUR_REQUEST)
                .status(status)
                .prospectName("Jane Doe")
                .prospectPhone(PHONE)
                .prospectEmail("jane@example.com")
                .preferredSlot(slot)
                .build();
        lead.setId(UUID.randomUUID());
        return lead;
    }

    private static UnitSummaryDTO unit(UUID unitId, UUID propertyId) {
        return new UnitSummaryDTO(unitId, propertyId, "Test Residency", "105", 1, 2, 0, 0, 1, 1, UnitType.SHARED_UNIT, null);
    }

    @Nested
    @ExtendWith(MockitoExtension.class)
    @DisplayName("TourRequestManagementService")
    class Management {

        @Mock private MarketplaceLeadRepository leadRepository;
        @Mock private UnitFacade unitFacade;
        @Mock private AuthorizationService authorizationService;
        @Mock private TourAvailabilityService tourAvailabilityService;
        @InjectMocks private TourRequestManagementServiceImpl service;

        private UUID propertyId;
        private UUID unitId;
        private final UUID landlordId = UUID.randomUUID();

        @BeforeEach
        void setUp() {
            propertyId = UUID.randomUUID();
            unitId = UUID.randomUUID();
            lenient().when(tourAvailabilityService.getSchedule(any())).thenReturn(TourSchedule.defaults(List.of()));
        }

        @Test
        @DisplayName("Flags a pending request whose visit is outside the current visiting hours")
        void flagsRequestsOutsideVisitingHours() {
            // 11:00 IST tomorrow is inside the default hours; the same request against a schedule closed every day is not
            Instant visit = LocalDate.now(TourSchedule.DEFAULT_ZONE).plusDays(1).atTime(11, 0).atZone(TourSchedule.DEFAULT_ZONE).toInstant();
            MarketplaceLeadTbl pending = tour(propertyId, unitId, LeadStatus.NEW, visit);
            when(leadRepository.findUpcomingTours(eq(propertyId), eq(LeadStatus.NEW), any(Instant.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(pending)));
            TourSchedule closed = new TourSchedule(true, TourSchedule.DEFAULT_ZONE, 60, 60, 14, null, Map.of(), List.of());

            assertFalse(service.listTourRequests(propertyId, TourRequestDTOs.TourRequestFilter.PENDING, PageRequest.of(0, 20))
                    .getContent().get(0).outsideVisitingHours());

            when(tourAvailabilityService.getSchedule(propertyId)).thenReturn(closed);
            assertTrue(service.listTourRequests(propertyId, TourRequestDTOs.TourRequestFilter.PENDING, PageRequest.of(0, 20))
                    .getContent().get(0).outsideVisitingHours());
        }

        @Test
        @DisplayName("Lists pending requests with contact details and unit numbers")
        void listPending() {
            MarketplaceLeadTbl pending = tour(propertyId, unitId, LeadStatus.NEW, Instant.now().plus(1, ChronoUnit.DAYS));
            when(leadRepository.findUpcomingTours(eq(propertyId), eq(LeadStatus.NEW), any(Instant.class), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(pending)));
            when(unitFacade.getUnitsByIds(anySet())).thenReturn(Map.of(unitId, unit(unitId, propertyId)));

            Page<TourRequestDTOs.LandlordTourRequestResponse> page =
                    service.listTourRequests(propertyId, TourRequestDTOs.TourRequestFilter.PENDING, PageRequest.of(0, 20));

            TourRequestDTOs.LandlordTourRequestResponse row = page.getContent().get(0);
            assertEquals("Jane Doe", row.prospectName());
            assertEquals(PHONE, row.prospectPhone());
            assertEquals("jane@example.com", row.prospectEmail());
            assertEquals("105", row.unitNumber());
            assertEquals(LeadStatus.NEW, row.status());
        }

        @Test
        @DisplayName("Past filter uses the past query and caps the page size")
        void listPastCapsPageSize() {
            when(leadRepository.findPastTours(eq(propertyId), any(Instant.class), any(Pageable.class))).thenReturn(Page.empty());

            service.listTourRequests(propertyId, TourRequestDTOs.TourRequestFilter.PAST, PageRequest.of(2, 500));

            verify(leadRepository).findPastTours(eq(propertyId), any(Instant.class), eq(PageRequest.of(2, 50)));
        }

        @Test
        @DisplayName("Approve requires LEASE_UPDATE on the request's property")
        void approveRequiresPermission() {
            MarketplaceLeadTbl pending = tour(propertyId, unitId, LeadStatus.NEW, Instant.now().plus(1, ChronoUnit.DAYS));
            when(leadRepository.findById(pending.getId())).thenReturn(Optional.of(pending));
            when(authorizationService.hasPermission(propertyId, "LEASE_UPDATE")).thenReturn(false);

            BusinessException ex = assertThrows(BusinessException.class, () -> service.approve(pending.getId(), landlordId));

            assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
            assertEquals(LeadStatus.NEW, pending.getStatus());
            verify(leadRepository, never()).saveAndFlush(any());
        }

        @Test
        @DisplayName("Approve and reject record the decision")
        void approveAndReject() {
            MarketplaceLeadTbl first = tour(propertyId, unitId, LeadStatus.NEW, Instant.now().plus(1, ChronoUnit.DAYS));
            MarketplaceLeadTbl second = tour(propertyId, unitId, LeadStatus.NEW, Instant.now().plus(2, ChronoUnit.DAYS));
            when(leadRepository.findById(first.getId())).thenReturn(Optional.of(first));
            when(leadRepository.findById(second.getId())).thenReturn(Optional.of(second));
            when(authorizationService.hasPermission(propertyId, "LEASE_UPDATE")).thenReturn(true);
            when(unitFacade.getUnitById(unitId)).thenReturn(Optional.of(unit(unitId, propertyId)));

            TourRequestDTOs.LandlordTourRequestResponse approved = service.approve(first.getId(), landlordId);
            TourRequestDTOs.LandlordTourRequestResponse rejected = service.reject(second.getId(), landlordId, "Fully booked that day");

            assertEquals(LeadStatus.APPROVED, approved.status());
            assertEquals(landlordId, first.getDecidedByUserId());
            assertEquals(LeadStatus.REJECTED, rejected.status());
            assertEquals("Fully booked that day", rejected.decisionNote());
            verify(leadRepository, times(2)).saveAndFlush(any(MarketplaceLeadTbl.class));
        }

        @Test
        @DisplayName("Bookings are not tour requests (404)")
        void bookingIsNotFound() {
            MarketplaceLeadTbl booking = tour(propertyId, unitId, LeadStatus.NEW, Instant.now().plus(1, ChronoUnit.DAYS));
            booking.setLeadType(LeadType.BOOKING);
            when(leadRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

            assertEquals(HttpStatus.NOT_FOUND,
                    assertThrows(BusinessException.class, () -> service.approve(booking.getId(), landlordId)).getStatus());
            verifyNoInteractions(authorizationService);
        }
    }

    @Nested
    @ExtendWith(MockitoExtension.class)
    @DisplayName("MyTourRequestService")
    class Mine {

        @Mock private MarketplaceLeadRepository leadRepository;
        @Mock private OtpService otpService;
        @Mock private PropertyFacade propertyFacade;
        @Mock private UnitFacade unitFacade;
        @InjectMocks private MyTourRequestServiceImpl service;

        private static final String TOKEN = "livic_otp_session_test";
        private UUID propertyId;
        private UUID unitId;

        @BeforeEach
        void setUp() {
            propertyId = UUID.randomUUID();
            unitId = UUID.randomUUID();
        }

        @Test
        @DisplayName("Lists requests for the verified phone with property details and cancellability")
        void listMine() {
            MarketplaceLeadTbl upcoming = tour(propertyId, unitId, LeadStatus.APPROVED, Instant.now().plus(1, ChronoUnit.DAYS));
            MarketplaceLeadTbl past = tour(propertyId, unitId, LeadStatus.NEW, Instant.now().minus(1, ChronoUnit.DAYS));
            when(otpService.resolveVerifiedPhone(TOKEN)).thenReturn(PHONE);
            when(leadRepository.findByProspectPhoneAndLeadType(eq(PHONE), eq(LeadType.TOUR_REQUEST), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(upcoming, past)));
            when(propertyFacade.getPropertiesByIds(anySet())).thenReturn(Map.of(propertyId,
                    new PropertySummaryDTO(propertyId, "Test Residency", "1 Test Road", "Pune", null, 3, true)));
            when(unitFacade.getUnitsByIds(anySet())).thenReturn(Map.of(unitId, unit(unitId, propertyId)));

            List<TourRequestDTOs.MyTourRequestResponse> rows = service.listMyTourRequests(TOKEN, PageRequest.of(0, 20)).getContent();

            assertEquals("Test Residency", rows.get(0).propertyName());
            assertEquals("105", rows.get(0).unitNumber());
            assertTrue(rows.get(0).cancellable());
            assertEquals(LeadStatus.EXPIRED, rows.get(1).status());
            assertFalse(rows.get(1).cancellable());
        }

        @Test
        @DisplayName("Another phone's request cannot be cancelled (404)")
        void cancelOtherPhonesRequest() {
            MarketplaceLeadTbl someoneElses = tour(propertyId, unitId, LeadStatus.NEW, Instant.now().plus(1, ChronoUnit.DAYS));
            someoneElses.setProspectPhone("9123456789");
            when(otpService.resolveVerifiedPhone(TOKEN)).thenReturn(PHONE);
            when(leadRepository.findById(someoneElses.getId())).thenReturn(Optional.of(someoneElses));

            assertEquals(HttpStatus.NOT_FOUND,
                    assertThrows(BusinessException.class, () -> service.cancelMyTourRequest(TOKEN, someoneElses.getId())).getStatus());
            assertEquals(LeadStatus.NEW, someoneElses.getStatus());
        }

        @Test
        @DisplayName("Cancelling an own active request marks it cancelled")
        void cancelOwnRequest() {
            MarketplaceLeadTbl mine = tour(propertyId, unitId, LeadStatus.NEW, Instant.now().plus(1, ChronoUnit.DAYS));
            when(otpService.resolveVerifiedPhone(TOKEN)).thenReturn(PHONE);
            when(leadRepository.findById(mine.getId())).thenReturn(Optional.of(mine));
            when(propertyFacade.getPropertiesByIds(anySet())).thenReturn(Map.of());
            when(unitFacade.getUnitById(unitId)).thenReturn(Optional.empty());

            TourRequestDTOs.MyTourRequestResponse response = service.cancelMyTourRequest(TOKEN, mine.getId());

            assertEquals(LeadStatus.CANCELLED, response.status());
            assertFalse(response.cancellable());
            verify(leadRepository).saveAndFlush(mine);
        }

        @Test
        @DisplayName("An invalid OTP session is rejected before any data is read")
        void invalidSession() {
            when(otpService.resolveVerifiedPhone(TOKEN)).thenThrow(new BusinessException("Invalid or expired OTP session token"));

            assertThrows(BusinessException.class, () -> service.listMyTourRequests(TOKEN, PageRequest.of(0, 20)));
            verifyNoInteractions(leadRepository);
        }

    }
}
