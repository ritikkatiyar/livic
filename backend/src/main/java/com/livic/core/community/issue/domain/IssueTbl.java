package com.livic.core.community.issue.domain;

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
import java.util.UUID;

@Entity
@Table(name = "issue_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueTbl extends BaseEntity {

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "block_id")
    private UUID blockId;

    @Column(name = "unit_id")
    private UUID unitId;

    @Column(name = "lease_id")
    private UUID leaseId;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "reported_by_user_id", nullable = false)
    private UUID reportedByUserId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 64)
    private IssueCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 32)
    private IssuePriority priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 64)
    @Builder.Default
    private IssueStatus status = IssueStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope", nullable = false, length = 32)
    private IssueScope scope;

    @Enumerated(EnumType.STRING)
    @Column(name = "escalation_status", nullable = false, length = 32)
    @Builder.Default
    private IssueEscalationStatus escalationStatus = IssueEscalationStatus.NONE;

    @Column(name = "escalation_level", nullable = false)
    @Builder.Default
    private Integer escalationLevel = 0;

    @Column(name = "assigned_contact_name", nullable = false, length = 128)
    private String assignedContactName;

    @Column(name = "assigned_contact_phone", length = 32)
    private String assignedContactPhone;
}
