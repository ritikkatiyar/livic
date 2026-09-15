package com.livic.features.marketplace;

import com.livic.features.marketplace.slots.TourSchedule;
import com.livic.features.marketplace.slots.TourSchedule.Blackout;
import com.livic.features.marketplace.slots.TourSchedule.TimeRange;
import com.livic.features.marketplace.slots.TourSlotCalculator;
import com.livic.features.marketplace.slots.TourSlotCalculator.Slot;
import com.livic.features.marketplace.slots.TourSlotCalculator.SlotDay;
import com.livic.features.marketplace.slots.TourSlotCalculator.SlotStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class TourSlotCalculatorTest {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    /** Monday 14 Sep 2026, 15:30 IST. */
    private static final LocalDate MONDAY = LocalDate.of(2026, 9, 14);
    private static final Instant NOW = MONDAY.atTime(15, 30).atZone(IST).toInstant();

    private static Instant at(LocalDate date, int hour, int minute) {
        return date.atTime(hour, minute).atZone(IST).toInstant();
    }

    private static TimeRange range(int startHour, int startMinute, int endHour, int endMinute) {
        return new TimeRange(LocalTime.of(startHour, startMinute), LocalTime.of(endHour, endMinute));
    }

    /** Weekdays 10:00-13:00 and 16:00-19:00, Saturday 10:00-14:00, Sunday closed. */
    private static TourSchedule custom(int slotMinutes, int minNoticeMinutes, Integer maxVisitors, List<Blackout> blackouts) {
        Map<DayOfWeek, List<TimeRange>> hours = new java.util.EnumMap<>(DayOfWeek.class);
        for (DayOfWeek day : List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY)) {
            hours.put(day, List.of(range(16, 0, 19, 0), range(10, 0, 13, 0)));
        }
        hours.put(DayOfWeek.SATURDAY, List.of(range(10, 0, 14, 0)));
        return new TourSchedule(true, IST, slotMinutes, minNoticeMinutes, 7, maxVisitors, hours, blackouts);
    }

    private static SlotDay day(List<SlotDay> days, LocalDate date) {
        return days.stream().filter(d -> d.date().equals(date)).findFirst().orElseThrow();
    }

    private static List<LocalTime> times(SlotDay day) {
        return day.slots().stream().map(Slot::localTime).toList();
    }

    @Test
    @DisplayName("Defaults reproduce the original hourly 9 AM - 7 PM slots for 14 days")
    void defaults() {
        List<SlotDay> days = TourSlotCalculator.calculate(TourSchedule.defaults(List.of()), NOW, List.of(), List.of());

        assertEquals(14, days.size());
        assertEquals(MONDAY, days.getFirst().date());
        SlotDay tomorrow = day(days, MONDAY.plusDays(1));
        assertEquals(11, tomorrow.slots().size());
        assertEquals(LocalTime.of(9, 0), tomorrow.slots().getFirst().localTime());
        assertEquals(LocalTime.of(19, 0), tomorrow.slots().getLast().localTime());
        assertTrue(tomorrow.slots().stream().allMatch(s -> s.status() == SlotStatus.AVAILABLE));
    }

    @Test
    @DisplayName("Windows are stepped by the slot length, sorted, and a slot must end inside its window")
    void windowsAndSlotLength() {
        SlotDay tuesday = day(TourSlotCalculator.calculate(custom(60, 0, null, List.of()), NOW, List.of(), List.of()), MONDAY.plusDays(1));
        assertEquals(List.of(LocalTime.of(10, 0), LocalTime.of(11, 0), LocalTime.of(12, 0),
                LocalTime.of(16, 0), LocalTime.of(17, 0), LocalTime.of(18, 0)), times(tuesday));

        SlotDay halfHourly = day(TourSlotCalculator.calculate(custom(30, 0, null, List.of()), NOW, List.of(), List.of()), MONDAY.plusDays(1));
        assertEquals(12, halfHourly.slots().size());
        assertEquals(LocalTime.of(18, 30), halfHourly.slots().getLast().localTime());

        TourSchedule oddWindow = new TourSchedule(true, IST, 60, 0, 7, null,
                Map.of(DayOfWeek.TUESDAY, List.of(range(10, 0, 11, 30))), List.of());
        assertEquals(List.of(LocalTime.of(10, 0)),
                times(day(TourSlotCalculator.calculate(oddWindow, NOW, List.of(), List.of()), MONDAY.plusDays(1))));
    }

    @Test
    @DisplayName("Days without hours are closed; the booking window limits the dates")
    void closedDaysAndWindow() {
        List<SlotDay> days = TourSlotCalculator.calculate(custom(60, 0, null, List.of()), NOW, List.of(), List.of());

        assertEquals(7, days.size());
        SlotDay sunday = day(days, LocalDate.of(2026, 9, 20));
        assertTrue(sunday.closed());
        assertTrue(sunday.slots().isEmpty());
        assertFalse(day(days, LocalDate.of(2026, 9, 19)).closed());
    }

    @Test
    @DisplayName("Past slots and slots inside the minimum notice are unavailable")
    void pastAndNotice() {
        // 15:30 now + 2 hours notice: today's 16:00 and 17:00 are too soon, 18:00 is bookable
        SlotDay today = day(TourSlotCalculator.calculate(custom(60, 120, null, List.of()), NOW, List.of(), List.of()), MONDAY);

        assertEquals(SlotStatus.UNAVAILABLE, today.slots().getFirst().status()); // 10:00, past
        assertEquals(SlotStatus.UNAVAILABLE, statusAt(today, 16, 0));
        assertEquals(SlotStatus.UNAVAILABLE, statusAt(today, 17, 0));
        assertEquals(SlotStatus.AVAILABLE, statusAt(today, 18, 0));
    }

    @Test
    @DisplayName("Partial blackouts block overlapping slots; whole-day blackouts close the day")
    void blackouts() {
        LocalDate tuesday = MONDAY.plusDays(1);
        LocalDate wednesday = MONDAY.plusDays(2);
        List<Blackout> blackouts = List.of(
                new Blackout(tuesday, range(11, 30, 12, 30)),
                new Blackout(wednesday, null));
        List<SlotDay> days = TourSlotCalculator.calculate(custom(60, 0, null, blackouts), NOW, List.of(), List.of());

        SlotDay tue = day(days, tuesday);
        assertEquals(SlotStatus.AVAILABLE, statusAt(tue, 10, 0));
        assertEquals(SlotStatus.UNAVAILABLE, statusAt(tue, 11, 0));
        assertEquals(SlotStatus.UNAVAILABLE, statusAt(tue, 12, 0));
        assertEquals(SlotStatus.AVAILABLE, statusAt(tue, 16, 0));

        assertTrue(day(days, wednesday).closed());
    }

    @Test
    @DisplayName("A slot is full once pending + approved visits reach the limit; declined wins over full")
    void capacityAndDeclined() {
        LocalDate tuesday = MONDAY.plusDays(1);
        List<Instant> active = List.of(at(tuesday, 10, 0), at(tuesday, 10, 0), at(tuesday, 11, 0));
        List<Instant> declined = List.of(at(tuesday, 10, 0).plusSeconds(20), at(tuesday, 12, 0));

        SlotDay tue = day(TourSlotCalculator.calculate(custom(60, 0, 2, List.of()), NOW, active, declined), tuesday);

        assertEquals(SlotStatus.DECLINED, statusAt(tue, 10, 0));
        assertEquals(SlotStatus.AVAILABLE, statusAt(tue, 11, 0));
        assertEquals(SlotStatus.DECLINED, statusAt(tue, 12, 0));

        SlotDay anonymous = day(TourSlotCalculator.calculate(custom(60, 0, 2, List.of()), NOW, active, List.of()), tuesday);
        assertEquals(SlotStatus.FULL, statusAt(anonymous, 10, 0));
    }

    @Test
    @DisplayName("findSlot matches slot starts to the minute and only inside the booking window")
    void findSlot() {
        TourSchedule schedule = custom(60, 0, null, List.of());
        LocalDate tuesday = MONDAY.plusDays(1);

        assertEquals(LocalTime.of(10, 0),
                TourSlotCalculator.findSlot(schedule, at(tuesday, 10, 0).plusSeconds(45), NOW, List.of(), List.of()).orElseThrow().localTime());
        assertTrue(TourSlotCalculator.findSlot(schedule, at(tuesday, 10, 30), NOW, List.of(), List.of()).isEmpty());
        assertTrue(TourSlotCalculator.findSlot(schedule, at(tuesday, 14, 0), NOW, List.of(), List.of()).isEmpty());
        assertTrue(TourSlotCalculator.findSlot(schedule, at(MONDAY.plusDays(8), 10, 0), NOW, List.of(), List.of()).isEmpty());
    }

    @Test
    @DisplayName("Slots follow the property's timezone, not UTC")
    void propertyTimezone() {
        // 10:00 IST is 04:30 UTC
        SlotDay tuesday = day(TourSlotCalculator.calculate(custom(60, 0, null, List.of()), NOW, List.of(), List.of()), MONDAY.plusDays(1));
        assertEquals(Instant.parse("2026-09-15T04:30:00Z"), tuesday.slots().getFirst().start());
    }

    @Test
    @DisplayName("Visits inside a slot are within visiting hours; closed days and blocked times are not")
    void withinVisitingHours() {
        LocalDate tuesday = MONDAY.plusDays(1);
        TourSchedule schedule = custom(60, 0, null, List.of(new Blackout(tuesday, range(16, 0, 17, 0))));

        assertTrue(TourSlotCalculator.isWithinVisitingHours(schedule, at(tuesday, 10, 20)));
        assertFalse(TourSlotCalculator.isWithinVisitingHours(schedule, at(tuesday, 14, 0)));
        assertFalse(TourSlotCalculator.isWithinVisitingHours(schedule, at(tuesday, 16, 0)));
        assertFalse(TourSlotCalculator.isWithinVisitingHours(schedule, at(LocalDate.of(2026, 9, 20), 11, 0)));
    }

    private static SlotStatus statusAt(SlotDay day, int hour, int minute) {
        return day.slots().stream()
                .filter(s -> s.localTime().equals(LocalTime.of(hour, minute)))
                .findFirst()
                .orElseThrow()
                .status();
    }
}
