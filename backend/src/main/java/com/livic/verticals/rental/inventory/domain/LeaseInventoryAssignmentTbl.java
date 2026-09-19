package com.livic.verticals.rental.inventory.domain;

import com.livic.verticals.rental.inventory.domain.enums.DeductionApprovalStatus;
import com.livic.verticals.rental.inventory.domain.enums.InventoryCondition;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "lease_inventory_assignment_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaseInventoryAssignmentTbl {

    @Id
    @Column(name = "id", nullable = false, length = 36)
    private UUID id;

    @Column(name = "lease_id", nullable = false, length = 36)
    private UUID leaseId;

    @Column(name = "item_id", nullable = false, length = 36)
    private UUID itemId;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_at_assignment", nullable = false, length = 32)
    private InventoryCondition conditionAtAssignment;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    @Column(name = "assignment_notes", columnDefinition = "TEXT")
    private String assignmentNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_at_return", length = 32)
    private InventoryCondition conditionAtReturn;

    @Column(name = "returned_at")
    private Instant returnedAt;

    @Column(name = "return_notes", columnDefinition = "TEXT")
    private String returnNotes;

    @Column(name = "damage_deduction_amount", precision = 12, scale = 2)
    private BigDecimal damageDeductionAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "deduction_approval_status", nullable = false, length = 32)
    private DeductionApprovalStatus deductionApprovalStatus;

    @Column(name = "verified_by", length = 36)
    private UUID verifiedBy;

    @Column(name = "settled_at")
    private Instant settledAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
