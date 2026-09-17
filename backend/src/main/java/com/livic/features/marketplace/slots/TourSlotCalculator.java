package com.livic.features.marketplace.slots;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Turns a {@link TourSchedule} into the concrete visit slots a prospect can pick. Pure and deterministic: every
 * input, including the current time, is passed in, so the public slot list, request validation and the landlord's
 * "outside visiting hours" flag always agree.
 */
public final class TourSlotCalculator {

    private static final int MINUTES_PER_DAY = 24 * 60;

    private TourSlotCalculator() {
    }

    public enum SlotStatus {
        AVAILABLE,
        /** Capacity reached by pending and approved requests. */
        FULL,
        /** The landlord declined this slot for the prospect asking. */
        DECLINED,
        /** In the past, inside the minimum notice period, or blocked by the landlord. */
        UNAVAILABLE
    }

    public record Slot(Instant start, LocalTime localTime, SlotStatus status) {
    }

    public record SlotDay(LocalDate date, DayOfWeek dayOfWeek, boolean closed, List<Slot> slots) {
    }

    /** Local dates a visit can currently be booked for: today (property time) through the booking window. */
    public static List<LocalDate> bookableDates(TourSchedule schedule, Instant now) {
        LocalDate today = LocalDate.ofInstant(now, schedule.zone());
        return today.datesUntil(today.plusDays(schedule.bookingWindowDays())).toList();
    }

    /**
     * Slots for every bookable date.
     *
     * @param activeTourSlots visit times of pending and approved requests at the property (for capacity)
     * @param declinedSlots   slots the landlord declined for the prospect asking; empty for anonymous visitors
     */
    public static List<SlotDay> calculate(TourSchedule schedule, Instant now,
                                          Collection<Instant> activeTourSlots, Collection<Instant> declinedSlots) {
        Set<Instant> declined = toMinutes(declinedSlots);
        return bookableDates(schedule, now).stream()
                .map(date -> calculateDay(schedule, date, now, activeTourSlots, declined))
                .toList();
    }

    /** The slot starting exactly at {@code start} (to the minute), if the schedule offers one inside the booking window. */
    public static Optional<Slot> findSlot(TourSchedule schedule, Instant start, Instant now,
                                          Collection<Instant> activeTourSlots, Collection<Instant> declinedSlots) {
        Instant minute = start.truncatedTo(ChronoUnit.MINUTES);
        LocalDate date = LocalDate.ofInstant(minute, schedule.zone());
        if (!bookableDates(schedule, now).contains(date)) {
            return Optional.empty();
        }
        return calculateDay(schedule, date, now, activeTourSlots, toMinutes(declinedSlots)).slots().stream()
                .filter(slot -> slot.start().equals(minute))
                .findFirst();
    }

    /**
     * Whether {@code visit} falls inside a slot the schedule offers on its date (ignoring notice, capacity and the
     * booking window). Used to flag existing requests after the landlord changes their hours.
     */
    public static boolean isWithinVisitingHours(TourSchedule schedule, Instant visit) {
        LocalDate date = LocalDate.ofInstant(visit, schedule.zone());
        return slotStartTimes(schedule, date).stream()
                .anyMatch(time -> {
                    Instant start = toInstant(schedule, date, time);
                    return !visit.isBefore(start)
                            && visit.isBefore(start.plus(schedule.slotMinutes(), ChronoUnit.MINUTES))
                            && !isBlackedOut(schedule, date, time);
                });
    }

    private static SlotDay calculateDay(TourSchedule schedule, LocalDate date, Instant now,
                                        Collection<Instant> activeTourSlots, Set<Instant> declined) {
        boolean wholeDayBlocked = schedule.blackouts().stream().anyMatch(b -> b.date().equals(date) && b.isWholeDay());
        List<LocalTime> times = slotStartTimes(schedule, date);
        if (wholeDayBlocked || times.isEmpty()) {
            return new SlotDay(date, date.getDayOfWeek(), true, List.of());
        }

        Instant earliestBookable = now.plus(schedule.minNoticeMinutes(), ChronoUnit.MINUTES);
        List<Slot> slots = new ArrayList<>(times.size());
        for (LocalTime time : times) {
            Instant start = toInstant(schedule, date, time);
            slots.add(new Slot(start, time, statusOf(schedule, date, time, start, earliestBookable, activeTourSlots, declined)));
        }
        return new SlotDay(date, date.getDayOfWeek(), false, slots);
    }

    private static SlotStatus statusOf(TourSchedule schedule, LocalDate date, LocalTime time, Instant start,
                                       Instant earliestBookable, Collection<Instant> activeTourSlots, Set<Instant> declined) {
        if (start.isBefore(earliestBookable) || isBlackedOut(schedule, date, time)) {
            return SlotStatus.UNAVAILABLE;
        }
        if (declined.contains(start)) {
            return SlotStatus.DECLINED;
        }
        if (schedule.maxVisitorsPerSlot() != null) {
            Instant end = start.plus(schedule.slotMinutes(), ChronoUnit.MINUTES);
            long booked = activeTourSlots.stream().filter(t -> !t.isBefore(start) && t.isBefore(end)).count();
            if (booked >= schedule.maxVisitorsPerSlot()) {
                return SlotStatus.FULL;
            }
        }
        return SlotStatus.AVAILABLE;
    }

    /** Slot start times on a date: each window stepped by the slot length, keeping only slots that end inside it. */
    private static List<LocalTime> slotStartTimes(TourSchedule schedule, LocalDate date) {
        return schedule.hoursOn(date.getDayOfWeek()).stream()
                .sorted(Comparator.comparing(TourSchedule.TimeRange::start))
                .flatMap(range -> {
                    List<LocalTime> starts = new ArrayList<>();
                    int end = minuteOfDay(range.end());
                    for (int minute = minuteOfDay(range.start());
                         minute + schedule.slotMinutes() <= end && minute < MINUTES_PER_DAY;
                         minute += schedule.slotMinutes()) {
                        starts.add(LocalTime.of(minute / 60, minute % 60));
                    }
                    return starts.stream();
                })
                .distinct()
                .toList();
    }

    private static boolean isBlackedOut(TourSchedule schedule, LocalDate date, LocalTime slotStart) {
        LocalTime slotEnd = slotStart.plusMinutes(schedule.slotMinutes());
        // A slot ending at midnight wraps to 00:00; treat it as ending at the last representable time
        LocalTime effectiveEnd = slotEnd.isAfter(slotStart) ? slotEnd : LocalTime.MAX;
        return schedule.blackouts().stream()
                .filter(b -> b.date().equals(date))
                .anyMatch(b -> b.isWholeDay() || b.range().overlaps(slotStart, effectiveEnd));
    }

    private static Instant toInstant(TourSchedule schedule, LocalDate date, LocalTime time) {
        return date.atTime(time).atZone(schedule.zone()).toInstant();
    }

    private static int minuteOfDay(LocalTime time) {
        return time.getHour() * 60 + time.getMinute();
    }

    private static Set<Instant> toMinutes(Collection<Instant> instants) {
        return instants.stream().map(i -> i.truncatedTo(ChronoUnit.MINUTES)).collect(Collectors.toSet());
    }
}
