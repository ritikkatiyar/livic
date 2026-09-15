package com.livic.features.marketplace.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** A property's tour booking rules. Absent row = defaults (see {@code TourSchedule.defaults}). */
@Entity
@Table(name = "tour_availability_settings_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourAvailabilitySettingsTbl extends BaseEntity {

    @Column(name = "property_id", nullable = false, unique = true)
    private UUID propertyId;

    @Column(name = "slot_minutes", nullable = false)
    private int slotMinutes;

    @Column(name = "min_notice_minutes", nullable = false)
    private int minNoticeMinutes;

    @Column(name = "booking_window_days", nullable = false)
    private int bookingWindowDays;

    /** Null means no limit. */
    @Column(name = "max_visitors_per_slot")
    private Integer maxVisitorsPerSlot;

    @Column(name = "timezone", nullable = false, length = 64)
    private String timezone;

    @Column(name = "updated_by_user_id")
    private UUID updatedByUserId;
}
