package com.livic.verticals.marketplace.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/** A date, or part of a date, when a property offers no visits. */
@Entity
@Table(name = "tour_blackout_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourBlackoutTbl extends BaseEntity {

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "blackout_date", nullable = false)
    private LocalDate blackoutDate;

    /** Null together with {@link #endTime} when the whole day is blocked. */
    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "reason", length = 200)
    private String reason;

    @Column(name = "created_by_user_id")
    private UUID createdByUserId;

    public boolean isWholeDay() {
        return startTime == null || endTime == null;
    }
}
