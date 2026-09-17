package com.livic.services.property.domain;

import com.livic.platform.common.domain.BaseEntity;
import com.livic.platform.common.domain.PropertyType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "property_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyTbl extends BaseEntity {
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String address;

    @Column(nullable = false)
    private String city;

    private String landmark;

    private Integer totalFloors;

    @Column(name = "auto_bill_day_of_month")
    private Integer autoBillDayOfMonth;

    @Column(name = "auto_bill_time")
    private LocalTime autoBillTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "property_type", nullable = false)
    @Builder.Default
    private PropertyType propertyType = PropertyType.RENTAL;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "allow_partial_payment", nullable = false)
    @Builder.Default
    private boolean allowPartialPayment = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "property_amenities_tbl", joinColumns = @JoinColumn(name = "property_id"))
    @Column(name = "amenity")
    @Builder.Default
    private List<String> amenities = new ArrayList<>();

    @Column(name = "is_publicly_listed", nullable = false)
    @Builder.Default
    private boolean isPubliclyListed = true;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "qr_slug", length = 64, unique = true)
    private String qrSlug;
}
