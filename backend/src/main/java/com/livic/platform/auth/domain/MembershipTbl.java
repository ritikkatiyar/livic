package com.livic.platform.auth.domain;

import com.livic.platform.common.domain.BaseEntity;
import com.livic.platform.common.enums.AccessType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "membership_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(callSuper = true)
public class MembershipTbl extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "title", nullable = false)
    @Builder.Default
    private String title = "Member";

    @Enumerated(EnumType.STRING)
    @Column(name = "access_type", nullable = false)
    @Builder.Default
    private AccessType accessType = AccessType.CUSTOM_ACCESS;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "assigned_by_id")
    private UUID assignedBy;

    public boolean isFullAccess() {
        return AccessType.FULL_ACCESS.equals(accessType);
    }
}
