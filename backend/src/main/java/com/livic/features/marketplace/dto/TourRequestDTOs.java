package com.livic.features.marketplace.dto;

import com.livic.platform.common.domain.LeadStatus;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDateTime;
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
        LocalDateTime createdAt
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
}
