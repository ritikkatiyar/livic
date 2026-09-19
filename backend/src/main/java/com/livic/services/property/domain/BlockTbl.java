package com.livic.services.property.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * A tower or wing inside a property. Rental and residential properties have a single default block
 * that the apps never show; societies name theirs (Tower A, Tower B).
 */
@Entity
@Table(name = "block_tbl", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"property_id", "name"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockTbl extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    @ToString.Exclude
    private PropertyTbl property;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    /** The block a property gets on creation, used when no tower was named. */
    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean isDefault = false;

    public static final String DEFAULT_NAME = "Main";
}
