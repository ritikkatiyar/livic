package com.livic.services.property.domain;

import com.livic.platform.common.domain.BaseEntity;
import com.livic.platform.common.domain.FacingDirection;
import com.livic.platform.common.domain.UnitType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "unit_tbl", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"property_id", "unit_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnitTbl extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    @ToString.Exclude
    private PropertyTbl property;

    @Column(name = "unit_number", nullable = false)
    private String unitNumber;

    @Column(nullable = false)
    private Integer floor;

    @Column(nullable = false)
    private Integer capacity;

    @Column(name = "grid_x", nullable = false)
    private Integer gridX;

    @Column(name = "grid_y", nullable = false)
    private Integer gridY;

    @Column(name = "grid_width", nullable = false)
    @Builder.Default
    private Integer gridWidth = 1;

    @Column(name = "grid_height", nullable = false)
    @Builder.Default
    private Integer gridHeight = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UnitType type;

    @Enumerated(EnumType.STRING)
    private FacingDirection facing;
}
