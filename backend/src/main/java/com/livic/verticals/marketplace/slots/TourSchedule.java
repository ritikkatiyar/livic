package com.livic.verticals.marketplace.slots;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * A property's visiting rules in plain values, independent of persistence.
 *
 * @param customized        false when the property never configured visiting hours and these are the defaults
 * @param maxVisitorsPerSlot null means no limit
 * @param weeklyHours       windows per day in the property's timezone; a missing or empty day is closed
 */
public record TourSchedule(
        boolean customized,
        ZoneId zone,
        int slotMinutes,
        int minNoticeMinutes,
        int bookingWindowDays,
        Integer maxVisitorsPerSlot,
        Map<DayOfWeek, List<TimeRange>> weeklyHours,
        List<Blackout> blackouts
) {

    public static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Kolkata");
    public static final int DEFAULT_SLOT_MINUTES = 60;
    public static final int DEFAULT_MIN_NOTICE_MINUTES = 60;
    public static final int DEFAULT_BOOKING_WINDOW_DAYS = 14;
    /** Every day 09:00-20:00: hourly slots from 9 AM to 7 PM, as offered before landlords could set hours. */
    public static final TimeRange DEFAULT_DAILY_HOURS = new TimeRange(LocalTime.of(9, 0), LocalTime.of(20, 0));

    public TourSchedule {
        weeklyHours = Map.copyOf(weeklyHours);
        blackouts = List.copyOf(blackouts);
    }

    public static TourSchedule defaults(List<Blackout> blackouts) {
        Map<DayOfWeek, List<TimeRange>> hours = new EnumMap<>(DayOfWeek.class);
        for (DayOfWeek day : DayOfWeek.values()) {
            hours.put(day, List.of(DEFAULT_DAILY_HOURS));
        }
        return new TourSchedule(false, DEFAULT_ZONE, DEFAULT_SLOT_MINUTES, DEFAULT_MIN_NOTICE_MINUTES,
                DEFAULT_BOOKING_WINDOW_DAYS, null, hours, blackouts);
    }

    public List<TimeRange> hoursOn(DayOfWeek day) {
        return weeklyHours.getOrDefault(day, List.of());
    }

    /** Start inclusive, end exclusive. */
    public record TimeRange(LocalTime start, LocalTime end) {
        public boolean overlaps(LocalTime otherStart, LocalTime otherEnd) {
            return otherStart.isBefore(end) && otherEnd.isAfter(start);
        }
    }

    /** A blocked date; {@code range} is null when the whole day is blocked. */
    public record Blackout(LocalDate date, TimeRange range) {
        public boolean isWholeDay() {
            return range == null;
        }
    }
}
