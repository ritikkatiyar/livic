package com.livic.core.property.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Who belongs to a unit: owners, tenants and family members alike.
 *
 * <p>This is the single answer to "who is in this flat". Notices, issues, the resident context
 * and live listings read it, so none of them need to know about leases. A tenant has both a
 * member row (who is here) and a lease (what was agreed); the two are written and ended together.
 */
@Entity
@Table(name = "unit_member_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnitMemberTbl extends BaseEntity {

    @Column(name = "unit_id", nullable = false)
    private UUID unitId;

    /** Null while an owner has been invited by phone but has not signed up yet. */
    @Column(name = "user_id")
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UnitMemberRole role;

    /** The primary owner or the tenant who signed the lease, as opposed to family members. */
    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private boolean isPrimary = false;

    /** Set for tenants; the contract behind the tenancy. */
    @Column(name = "lease_id")
    private UUID leaseId;

    /** Phone used to invite someone who has no account yet. */
    @Column(name = "invited_phone", length = 20)
    private String invitedPhone;

    @Column(name = "from_date", nullable = false)
    private LocalDate fromDate;

    @Column(name = "to_date")
    private LocalDate toDate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "assigned_by_id")
    private UUID assignedBy;

    /** Ends the membership on the given date; the row stays for history. */
    public void end(LocalDate on) {
        this.toDate = on;
        this.isActive = false;
    }
}
