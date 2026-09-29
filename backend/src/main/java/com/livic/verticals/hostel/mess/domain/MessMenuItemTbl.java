package com.livic.verticals.hostel.mess.domain;

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

import java.time.DayOfWeek;
import java.util.UUID;

/** One dish served in a meal slot on a day of the week. */
@Entity
@Table(name = "mess_menu_item_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessMenuItemTbl extends BaseEntity {

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "slot_id", nullable = false)
    private UUID slotId;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 9)
    private DayOfWeek dayOfWeek;

    @Column(name = "name", nullable = false, length = 80)
    private String name;

    /** Null when the admin has not marked the dish. */
    @Enumerated(EnumType.STRING)
    @Column(name = "diet_type", length = 8)
    private DietType dietType;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
