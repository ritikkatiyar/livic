package com.livic.features.marketplace;

import com.livic.features.marketplace.domain.MarketplaceLeadTbl;
import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.domain.LeadType;
import com.livic.platform.common.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class MarketplaceLeadTblTourLifecycleTest {

    private final Instant now = Instant.parse("2026-09-14T10:00:00Z");
    private final UUID landlordId = UUID.randomUUID();

    private MarketplaceLeadTbl tour(LeadStatus status, Instant slot) {
        return MarketplaceLeadTbl.builder()
                .propertyId(UUID.randomUUID())
                .unitId(UUID.randomUUID())
                .leadType(LeadType.TOUR_REQUEST)
                .status(status)
                .prospectName("Jane")
                .prospectPhone("9876543210")
                .preferredSlot(slot)
                .build();
    }

    private Instant tomorrow() {
        return now.plus(1, ChronoUnit.DAYS);
    }

    private Instant yesterday() {
        return now.minus(1, ChronoUnit.DAYS);
    }

    @Test
    @DisplayName("Pending and approved tours with a future slot are active; everything else is not")
    void activeTour() {
        assertTrue(tour(LeadStatus.NEW, tomorrow()).isActiveTour(now));
        assertTrue(tour(LeadStatus.APPROVED, tomorrow()).isActiveTour(now));
        assertFalse(tour(LeadStatus.NEW, yesterday()).isActiveTour(now));
        assertFalse(tour(LeadStatus.REJECTED, tomorrow()).isActiveTour(now));
        assertFalse(tour(LeadStatus.CANCELLED, tomorrow()).isActiveTour(now));

        MarketplaceLeadTbl booking = tour(LeadStatus.NEW, tomorrow());
        booking.setLeadType(LeadType.BOOKING);
        assertFalse(booking.isActiveTour(now));
    }

    @Test
    @DisplayName("Past active tours report EXPIRED (pending) or COMPLETED (approved)")
    void effectiveStatus() {
        assertEquals(LeadStatus.EXPIRED, tour(LeadStatus.NEW, yesterday()).effectiveStatus(now));
        assertEquals(LeadStatus.COMPLETED, tour(LeadStatus.APPROVED, yesterday()).effectiveStatus(now));
        assertEquals(LeadStatus.REJECTED, tour(LeadStatus.REJECTED, yesterday()).effectiveStatus(now));
        assertEquals(LeadStatus.NEW, tour(LeadStatus.NEW, tomorrow()).effectiveStatus(now));

        MarketplaceLeadTbl past = tour(LeadStatus.APPROVED, yesterday());
        assertTrue(past.closeIfVisitPassed(now));
        assertEquals(LeadStatus.COMPLETED, past.getStatus());
        assertFalse(past.closeIfVisitPassed(now));
    }

    @Test
    @DisplayName("Approve records the decision on a pending future tour")
    void approve() {
        MarketplaceLeadTbl lead = tour(LeadStatus.NEW, tomorrow());
        lead.approve(landlordId, now);

        assertEquals(LeadStatus.APPROVED, lead.getStatus());
        assertEquals(landlordId, lead.getDecidedByUserId());
        assertEquals(now, lead.getDecidedAt());
    }

    @Test
    @DisplayName("Reject stores a trimmed note, or none when blank")
    void reject() {
        MarketplaceLeadTbl withNote = tour(LeadStatus.NEW, tomorrow());
        withNote.reject(landlordId, "  Room under maintenance  ", now);
        assertEquals(LeadStatus.REJECTED, withNote.getStatus());
        assertEquals("Room under maintenance", withNote.getDecisionNote());

        MarketplaceLeadTbl blankNote = tour(LeadStatus.NEW, tomorrow());
        blankNote.reject(landlordId, "   ", now);
        assertNull(blankNote.getDecisionNote());
    }

    @Test
    @DisplayName("Only pending tours with a future slot can be decided")
    void decisionsRequirePendingFutureTour() {
        BusinessException alreadyApproved = assertThrows(BusinessException.class,
                () -> tour(LeadStatus.APPROVED, tomorrow()).reject(landlordId, null, now));
        assertEquals(HttpStatus.CONFLICT, alreadyApproved.getStatus());

        BusinessException visitPassed = assertThrows(BusinessException.class,
                () -> tour(LeadStatus.NEW, yesterday()).approve(landlordId, now));
        assertEquals(HttpStatus.CONFLICT, visitPassed.getStatus());
        assertTrue(visitPassed.getMessage().contains("EXPIRED"));

        MarketplaceLeadTbl booking = tour(LeadStatus.NEW, tomorrow());
        booking.setLeadType(LeadType.BOOKING);
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(BusinessException.class, () -> booking.approve(landlordId, now)).getStatus());
    }

    @Test
    @DisplayName("Prospect can cancel pending or approved tours before the visit, not afterwards")
    void cancelByProspect() {
        MarketplaceLeadTbl approved = tour(LeadStatus.APPROVED, tomorrow());
        approved.cancelByProspect(now);
        assertEquals(LeadStatus.CANCELLED, approved.getStatus());
        assertEquals(now, approved.getCancelledAt());

        assertEquals(HttpStatus.CONFLICT, assertThrows(BusinessException.class,
                () -> tour(LeadStatus.NEW, yesterday()).cancelByProspect(now)).getStatus());
        assertEquals(HttpStatus.CONFLICT, assertThrows(BusinessException.class,
                () -> tour(LeadStatus.REJECTED, tomorrow()).cancelByProspect(now)).getStatus());
    }
}
