package com.livic.core.property.domain;


import com.livic.platform.common.domain.BaseEntity;
import com.livic.platform.common.enums.AccessType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "property_join_code_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(callSuper = true)
public class PropertyJoinCodeTbl extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    @ToString.Exclude
    private PropertyTbl property;

    @Column(name = "title", nullable = false)
    @Builder.Default
    private String title = "Member";

    @Enumerated(EnumType.STRING)
    @Column(name = "access_type", nullable = false)
    @Builder.Default
    private AccessType accessType = AccessType.CUSTOM_ACCESS;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "property_join_code_permission_tbl",
            joinColumns = @JoinColumn(name = "join_code_id")
    )
    @Column(name = "permission_code", nullable = false)
    @Builder.Default
    private Set<String> permissionCodes = new HashSet<>();

    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "max_uses", nullable = false)
    @Builder.Default
    private int maxUses = 1;

    @Column(name = "uses_count", nullable = false)
    @Builder.Default
    private int usesCount = 0;

    @Column(name = "expires_at")
    private Instant expiresAt;
}
