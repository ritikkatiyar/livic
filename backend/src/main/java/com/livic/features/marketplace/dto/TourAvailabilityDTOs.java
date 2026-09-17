package com.livic.features.marketplace.dto;

import com.livic.features.marketplace.slots.TourSlotCalculator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public class TourAvailabilityDTOs {

    // --- Landlord configuration ------------------------------------------------------------------------------

    public record TimeWindow(
        @NotNull(message = "Start time is required") LocalTime start,
        @NotNull(message = "End time is required") LocalTime end
    ) {}

    public record DayHours(
        @NotNull(message = "Day of week is required") DayOfWeek dayOfWeek,
        @NotNull @Size(max = 6, message = "At most 6 time windows per day") List<@Valid TimeWindow> windows
    ) {}

    public record UpdateTourAvailabilityRequest(
        @NotNull(message = "Slot length is required") Integer slotMinutes,
        @NotNull(message = "Minimum notice is required")
        @Min(value = 0, message = "Minimum notice can't be negative")
        @Max(value = 10080, message = "Minimum notice can be at most 7 days") Integer minNoticeMinutes,
        @NotNull(message = "Booking window is required")
        @Min(value = 1, message = "Booking window must be at least 1 day")
        @Max(value = 30, message = "Booking window can be at most 30 days") Integer bookingWindowDays,
        @Min(value = 1, message = "Allow at least 1 visitor per slot, or leave empty for no limit")
        @Max(value = 50, message = "At most 50 visitors per slot") Integer maxVisitorsPerSlot,
        /** IANA timezone, e.g. Asia/Kolkata; keeps the current one when omitted. */
        String timezone,
        /** Days not listed (or listed with no windows) are closed. */
        @NotNull(message = "Weekly hours are required") @Size(max = 7) List<@Valid DayHours> weeklyHours
    ) {}

    public record TourAvailabilityResponse(
        UUID propertyId,
        /** False while the property still uses the default hours. */
        boolean customized,
        String timezone,
        int slotMinutes,
        int minNoticeMinutes,
        int bookingWindowDays,
        Integer maxVisitorsPerSlot,
        /** All seven days, Monday first; closed days have no windows. */
        List<DayHours> weeklyHours,
        /** Blocked dates from today onwards. */
        List<BlackoutResponse> blackouts
    ) {}

    public record CreateBlackoutRequest(
        @NotNull(message = "Date is required") LocalDate date,
        /** Leave both times empty to block the whole day. */
        LocalTime startTime,
        LocalTime endTime,
        @Size(max = 200, message = "Reason must be at most 200 characters") String reason
    ) {}

    public record BlackoutResponse(
        UUID id,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        String reason
    ) {}

    // --- Public slots ----------------------------------------------------------------------------------------

    public record TourSlotsResponse(
        UUID propertyId,
        String timezone,
        int slotMinutes,
        List<TourSlotDay> days
    ) {}

    public record TourSlotDay(
        LocalDate date,
        DayOfWeek dayOfWeek,
        /** No visiting hours that day, or the whole day is blocked. */
        boolean closed,
        List<TourSlot> slots
    ) {}

    public record TourSlot(
        Instant start,
        /** Start time in the property's timezone. */
        LocalTime localTime,
        TourSlotCalculator.SlotStatus status
    ) {}
}
