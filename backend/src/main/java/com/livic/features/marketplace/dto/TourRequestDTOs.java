package com.livic.features.marketplace.dto;

import com.livic.platform.common.domain.LeadStatus;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class TourRequestDTOs {

    /** Landlord list filter. */
    public enum TourRequestFilter {
        /** Awaiting a decision, visit still ahead. */
        PENDING,
        /** Approved, visit still ahead. */
        UPCOMING,
        /** Rejected, cancelled, or visit time passed. */
        PAST
    }

    /** A tour request as shown to property staff, including the prospect's contact details. */
    public record LandlordTourRequestResponse(
        UUID id,
        UUID propertyId,
        UUID unitId,
        String unitNumber,
        String prospectName,
        String prospectPhone,
        String prospectEmail,
        Instant preferredSlot,
        LeadStatus status,
        String decisionNote,
        Instant decidedAt,
        LocalDateTime createdAt,
        /** True for a pending or upcoming request whose visit no longer falls inside the property's visiting hours. */
        boolean outsideVisitingHours
    ) {}

    public record TourRequestSummaryResponse(
        long pending,
        long upcoming
    ) {}

    public record RejectTourRequest(
        @Size(max = 500, message = "Note must be at most 500 characters") String note
    ) {}

    /** A tour request as shown to the prospect who made it (no contact details of other people). */
    public record MyTourRequestResponse(
        UUID id,
        UUID propertyId,
        String propertyName,
        String propertyAddress,
        String propertyCity,
        UUID unitId,
        String unitNumber,
        Instant preferredSlot,
        LeadStatus status,
        String decisionNote,
        Instant decidedAt,
        boolean cancellable,
        LocalDateTime createdAt
    ) {}

    /** The request that blocks a new tour request at the same property. */
    public record ExistingTourRequestSummary(
        UUID leadId,
        UUID unitId,
        String unitNumber,
        LeadStatus status,
        Instant preferredSlot
    ) {}

    /** 409 body for a duplicate tour request: the standard error fields plus the blocking request. */
    public record DuplicateTourRequestError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        ExistingTourRequestSummary existingRequest
    ) {}

    /** 409 body when the requested visit time can't be booked: the standard error fields plus a code (TOUR_SLOT_*) and the slot. */
    public record TourSlotUnavailableError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        String code,
        Instant slot
    ) {}

    /** Upcoming slots the prospect can't request again at a property because the landlord declined them. */
    public record DeclinedTourSlotsResponse(
        UUID propertyId,
        List<Instant> slots
    ) {}
}
