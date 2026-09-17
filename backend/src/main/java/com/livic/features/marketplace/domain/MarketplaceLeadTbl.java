package com.livic.features.marketplace.domain;

import com.livic.platform.common.domain.BaseEntity;
import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.domain.LeadType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import com.livic.features.marketplace.exception.TourRequestStateException;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "marketplace_lead_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceLeadTbl extends BaseEntity {

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "unit_id", nullable = false)
    private UUID unitId;

    @Enumerated(EnumType.STRING)
    @Column(name = "lead_type", nullable = false, length = 32)
    private LeadType leadType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private LeadStatus status = LeadStatus.NEW;

    @Column(name = "prospect_name", nullable = false)
    private String prospectName;

    @Column(name = "prospect_phone", nullable = false, length = 20)
    private String prospectPhone;

    @Column(name = "prospect_email")
    private String prospectEmail;

    @Column(name = "preferred_slot")
    private Instant preferredSlot;

    @Column(name = "expected_move_in_date")
    private LocalDate expectedMoveInDate;

    @Column(name = "token_amount", precision = 12, scale = 2)
    private BigDecimal tokenAmount;

    @Column(name = "payment_transaction_id")
    private UUID paymentTransactionId;

    @Column(name = "converted_unit_booking_id")
    private UUID convertedUnitBookingId;

    @Column(name = "source", length = 32)
    @Builder.Default
    private String source = "MARKETPLACE";

    /** Landlord's note to the prospect when deciding a tour request. */
    @Column(name = "decision_note", length = 500)
    private String decisionNote;

    @Column(name = "decided_by_user_id")
    private UUID decidedByUserId;

    @Column(name = "decided_at")
    private Instant decidedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    /**
     * Guards concurrent landlord decisions and prospect cancellation. Left null until first persist: Spring Data treats
     * an entity with a non-null version as existing and would merge a copy instead of persisting (losing the new id).
     */
    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    // --- Tour request lifecycle ------------------------------------------------------------------------------

    public boolean isTourRequest() {
        return leadType == LeadType.TOUR_REQUEST;
    }

    /** Pending or approved with the visit still ahead: blocks another tour at the same property and can be acted on. */
    public boolean isActiveTour(Instant now) {
        return isTourRequest()
                && (status == LeadStatus.NEW || status == LeadStatus.APPROVED)
                && preferredSlot != null && preferredSlot.isAfter(now);
    }

    /**
     * Status as the visitor or landlord should see it: an active tour whose visit time has passed is reported as
     * EXPIRED (never decided) or COMPLETED (approved), even before the lifecycle job persists that change.
     */
    public LeadStatus effectiveStatus(Instant now) {
        if (isTourRequest() && preferredSlot != null && !preferredSlot.isAfter(now)) {
            if (status == LeadStatus.NEW) return LeadStatus.EXPIRED;
            if (status == LeadStatus.APPROVED) return LeadStatus.COMPLETED;
        }
        return status;
    }

    /** Persists the past-visit transition; returns true if the status changed. */
    public boolean closeIfVisitPassed(Instant now) {
        LeadStatus effective = effectiveStatus(now);
        if (effective != status) {
            status = effective;
            return true;
        }
        return false;
    }

    public void approve(UUID landlordUserId, Instant now) {
        requirePendingTour(now, "approved");
        status = LeadStatus.APPROVED;
        decidedByUserId = landlordUserId;
        decidedAt = now;
    }

    public void reject(UUID landlordUserId, String note, Instant now) {
        requirePendingTour(now, "rejected");
        status = LeadStatus.REJECTED;
        decisionNote = note != null && !note.isBlank() ? note.trim() : null;
        decidedByUserId = landlordUserId;
        decidedAt = now;
    }

    public void cancelByProspect(Instant now) {
        if (!isActiveTour(now)) {
            throw new TourRequestStateException(
                    "This tour request can no longer be cancelled (current status: " + effectiveStatus(now) + ")");
        }
        status = LeadStatus.CANCELLED;
        cancelledAt = now;
    }

    private void requirePendingTour(Instant now, String action) {
        if (!isTourRequest()) {
            // Services only load tour requests before deciding, so reaching this is a programming error
            throw new IllegalStateException("Only tour requests can be " + action);
        }
        if (status != LeadStatus.NEW || !isActiveTour(now)) {
            throw new TourRequestStateException(
                    "This tour request can no longer be " + action + " (current status: " + effectiveStatus(now) + ")");
        }
    }
}
