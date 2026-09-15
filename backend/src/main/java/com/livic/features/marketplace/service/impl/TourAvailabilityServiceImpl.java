package com.livic.features.marketplace.service.impl;

import com.livic.features.marketplace.domain.TourAvailabilitySettingsTbl;
import com.livic.features.marketplace.domain.TourAvailabilityWindowTbl;
import com.livic.features.marketplace.domain.TourBlackoutTbl;
import com.livic.features.marketplace.dto.TourAvailabilityDTOs;
import com.livic.features.marketplace.exception.TourSlotUnavailableException;
import com.livic.features.marketplace.repository.MarketplaceLeadRepository;
import com.livic.features.marketplace.repository.TourAvailabilitySettingsRepository;
import com.livic.features.marketplace.repository.TourAvailabilityWindowRepository;
import com.livic.features.marketplace.repository.TourBlackoutRepository;
import com.livic.features.marketplace.service.interfaces.OtpService;
import com.livic.features.marketplace.service.interfaces.TourAvailabilityService;
import com.livic.features.marketplace.slots.TourSchedule;
import com.livic.features.marketplace.slots.TourSlotCalculator;
import com.livic.platform.auth.service.interfaces.AuthorizationService;
import com.livic.platform.common.exception.BusinessException;
import com.livic.services.property.facade.PropertyFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TourAvailabilityServiceImpl implements TourAvailabilityService {

    private static final Set<Integer> SLOT_LENGTHS = Set.of(30, 60);
    /** Visiting hours and blocked times are set on the half hour, so both slot lengths line up. */
    private static final int TIME_STEP_MINUTES = 30;
    private static final int MAX_BLACKOUT_DAYS_AHEAD = 365;

    private final TourAvailabilitySettingsRepository settingsRepository;
    private final TourAvailabilityWindowRepository windowRepository;
    private final TourBlackoutRepository blackoutRepository;
    private final MarketplaceLeadRepository leadRepository;
    private final OtpService otpService;
    private final PropertyFacade propertyFacade;
    private final AuthorizationService authorizationService;

    // --- Landlord configuration ------------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public TourAvailabilityDTOs.TourAvailabilityResponse getAvailability(UUID propertyId) {
        TourSchedule schedule = getSchedule(propertyId);
        LocalDate today = LocalDate.now(schedule.zone());
        List<TourAvailabilityDTOs.BlackoutResponse> blackouts = blackoutRepository
                .findByPropertyIdAndBlackoutDateGreaterThanEqualOrderByBlackoutDateAscStartTimeAsc(propertyId, today)
                .stream()
                .map(TourAvailabilityServiceImpl::toBlackoutResponse)
                .toList();

        List<TourAvailabilityDTOs.DayHours> weeklyHours = Arrays.stream(DayOfWeek.values())
                .map(day -> new TourAvailabilityDTOs.DayHours(day, schedule.hoursOn(day).stream()
                        .map(range -> new TourAvailabilityDTOs.TimeWindow(range.start(), range.end()))
                        .toList()))
                .toList();

        return new TourAvailabilityDTOs.TourAvailabilityResponse(
                propertyId,
                schedule.customized(),
                schedule.zone().getId(),
                schedule.slotMinutes(),
                schedule.minNoticeMinutes(),
                schedule.bookingWindowDays(),
                schedule.maxVisitorsPerSlot(),
                weeklyHours,
                blackouts
        );
    }

    @Override
    @Transactional
    public TourAvailabilityDTOs.TourAvailabilityResponse updateAvailability(
            UUID propertyId, TourAvailabilityDTOs.UpdateTourAvailabilityRequest request, UUID userId) {
        if (!SLOT_LENGTHS.contains(request.slotMinutes())) {
            throw new BusinessException("Slot length must be 30 or 60 minutes");
        }
        Map<DayOfWeek, List<TourAvailabilityDTOs.TimeWindow>> weeklyHours = validateWeeklyHours(request.weeklyHours(), request.slotMinutes());

        // Replace the windows first: the bulk delete clears the persistence context
        windowRepository.deleteByPropertyId(propertyId);

        TourAvailabilitySettingsTbl settings = settingsRepository.findByPropertyId(propertyId)
                .orElseGet(() -> TourAvailabilitySettingsTbl.builder().propertyId(propertyId).timezone(TourSchedule.DEFAULT_ZONE.getId()).build());
        if (request.timezone() != null && !request.timezone().isBlank()) {
            settings.setTimezone(parseZone(request.timezone().trim()).getId());
        }
        settings.setSlotMinutes(request.slotMinutes());
        settings.setMinNoticeMinutes(request.minNoticeMinutes());
        settings.setBookingWindowDays(request.bookingWindowDays());
        settings.setMaxVisitorsPerSlot(request.maxVisitorsPerSlot());
        settings.setUpdatedByUserId(userId);
        settingsRepository.save(settings);

        List<TourAvailabilityWindowTbl> windows = new ArrayList<>();
        weeklyHours.forEach((day, dayWindows) -> dayWindows.forEach(window -> windows.add(TourAvailabilityWindowTbl.builder()
                .propertyId(propertyId)
                .dayOfWeek(day)
                .startTime(window.start())
                .endTime(window.end())
                .build())));
        windowRepository.saveAll(windows);

        log.info("tour_availability_updated propertyId={} userId={} slotMinutes={} windows={} maxVisitorsPerSlot={}",
                propertyId, userId, request.slotMinutes(), windows.size(), request.maxVisitorsPerSlot());
        return getAvailability(propertyId);
    }

    @Override
    @Transactional
    public TourAvailabilityDTOs.BlackoutResponse addBlackout(UUID propertyId, TourAvailabilityDTOs.CreateBlackoutRequest request, UUID userId) {
        ZoneId zone = zoneOf(settingsRepository.findByPropertyId(propertyId));
        LocalDate today = LocalDate.now(zone);
        if (request.date().isBefore(today)) {
            throw new BusinessException("Blocked dates can't be in the past");
        }
        if (request.date().isAfter(today.plusDays(MAX_BLACKOUT_DAYS_AHEAD))) {
            throw new BusinessException("Dates can be blocked at most a year ahead");
        }
        if ((request.startTime() == null) != (request.endTime() == null)) {
            throw new BusinessException("Provide both a start and an end time, or neither to block the whole day");
        }
        if (request.startTime() != null) {
            requireOnTimeStep(request.startTime());
            requireOnTimeStep(request.endTime());
            if (!request.startTime().isBefore(request.endTime())) {
                throw new BusinessException("Blocked time must end after it starts");
            }
        }

        TourBlackoutTbl blackout = blackoutRepository.save(TourBlackoutTbl.builder()
                .propertyId(propertyId)
                .blackoutDate(request.date())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .reason(request.reason() != null && !request.reason().isBlank() ? request.reason().trim() : null)
                .createdByUserId(userId)
                .build());
        log.info("tour_blackout_added propertyId={} blackoutId={} date={} userId={}", propertyId, blackout.getId(), request.date(), userId);
        return toBlackoutResponse(blackout);
    }

    @Override
    @Transactional
    public void deleteBlackout(UUID blackoutId) {
        TourBlackoutTbl blackout = blackoutRepository.findById(blackoutId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Blocked date not found"));
        if (!authorizationService.hasPermission(blackout.getPropertyId(), "LEASE_UPDATE")) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Access Denied");
        }
        blackoutRepository.delete(blackout);
        log.info("tour_blackout_deleted propertyId={} blackoutId={}", blackout.getPropertyId(), blackoutId);
    }

    // --- Slots -----------------------------------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public TourAvailabilityDTOs.TourSlotsResponse getTourSlots(UUID propertyId, String otpSessionToken) {
        if (propertyFacade.getPublicListing(propertyId).isEmpty()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Property not found or not publicly listed: " + propertyId);
        }
        TourSchedule schedule = getSchedule(propertyId);
        Instant now = Instant.now();

        List<LocalDate> dates = TourSlotCalculator.bookableDates(schedule, now);
        Instant from = dates.getFirst().atStartOfDay(schedule.zone()).toInstant();
        Instant to = dates.getLast().plusDays(1).atStartOfDay(schedule.zone()).toInstant();
        List<Instant> activeTours = schedule.maxVisitorsPerSlot() != null
                ? leadRepository.findActiveTourSlotsBetween(propertyId, from, to)
                : List.of();
        List<Instant> declined = verifiedPhone(otpSessionToken)
                .map(phone -> leadRepository.findUpcomingRejectedTourSlots(propertyId, phone, now))
                .orElse(List.of());

        List<TourAvailabilityDTOs.TourSlotDay> days = TourSlotCalculator.calculate(schedule, now, activeTours, declined).stream()
                .map(day -> new TourAvailabilityDTOs.TourSlotDay(day.date(), day.dayOfWeek(), day.closed(), day.slots().stream()
                        .map(slot -> new TourAvailabilityDTOs.TourSlot(slot.start(), slot.localTime(), slot.status()))
                        .toList()))
                .toList();
        return new TourAvailabilityDTOs.TourSlotsResponse(propertyId, schedule.zone().getId(), schedule.slotMinutes(), days);
    }

    @Override
    @Transactional
    public void requireBookableSlot(UUID propertyId, String phone, Instant slot) {
        Instant start = slot.truncatedTo(ChronoUnit.MINUTES);
        // Serialises capacity checks for this property until the request is saved and the transaction commits
        TourSchedule schedule = toSchedule(propertyId, settingsRepository.findByPropertyIdForUpdate(propertyId));

        List<Instant> activeTours = schedule.maxVisitorsPerSlot() != null
                ? leadRepository.findActiveTourSlotsBetween(propertyId, start, start.plus(schedule.slotMinutes(), ChronoUnit.MINUTES))
                : List.of();
        List<Instant> declined = leadRepository.existsRejectedTourInSlot(propertyId, phone, start, start.plus(1, ChronoUnit.MINUTES))
                ? List.of(start)
                : List.of();

        TourSlotCalculator.SlotStatus status = TourSlotCalculator.findSlot(schedule, start, Instant.now(), activeTours, declined)
                .map(TourSlotCalculator.Slot::status)
                .orElse(TourSlotCalculator.SlotStatus.UNAVAILABLE);

        switch (status) {
            case AVAILABLE -> { }
            case DECLINED -> throw new TourSlotUnavailableException(TourSlotUnavailableException.Reason.DECLINED, start);
            case FULL -> throw new TourSlotUnavailableException(TourSlotUnavailableException.Reason.FULL, start);
            case UNAVAILABLE -> throw new TourSlotUnavailableException(TourSlotUnavailableException.Reason.UNAVAILABLE, start);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public TourSchedule getSchedule(UUID propertyId) {
        return toSchedule(propertyId, settingsRepository.findByPropertyId(propertyId));
    }

    // --- Helpers ---------------------------------------------------------------------------------------------

    private TourSchedule toSchedule(UUID propertyId, Optional<TourAvailabilitySettingsTbl> settings) {
        ZoneId zone = zoneOf(settings);
        List<TourSchedule.Blackout> blackouts = blackoutRepository
                .findByPropertyIdAndBlackoutDateGreaterThanEqualOrderByBlackoutDateAscStartTimeAsc(propertyId, LocalDate.now(zone).minusDays(1))
                .stream()
                .map(b -> new TourSchedule.Blackout(b.getBlackoutDate(),
                        b.isWholeDay() ? null : new TourSchedule.TimeRange(b.getStartTime(), b.getEndTime())))
                .toList();

        if (settings.isEmpty()) {
            return TourSchedule.defaults(blackouts);
        }

        Map<DayOfWeek, List<TourSchedule.TimeRange>> hours = new EnumMap<>(DayOfWeek.class);
        windowRepository.findByPropertyIdOrderByDayOfWeekAscStartTimeAsc(propertyId).forEach(w ->
                hours.computeIfAbsent(w.getDayOfWeek(), d -> new ArrayList<>()).add(new TourSchedule.TimeRange(w.getStartTime(), w.getEndTime())));
        hours.values().forEach(ranges -> ranges.sort(Comparator.comparing(TourSchedule.TimeRange::start)));

        TourAvailabilitySettingsTbl s = settings.get();
        return new TourSchedule(true, zone, s.getSlotMinutes(), s.getMinNoticeMinutes(), s.getBookingWindowDays(),
                s.getMaxVisitorsPerSlot(), hours, blackouts);
    }

    private static ZoneId zoneOf(Optional<TourAvailabilitySettingsTbl> settings) {
        return settings.map(s -> parseZone(s.getTimezone())).orElse(TourSchedule.DEFAULT_ZONE);
    }

    private Optional<String> verifiedPhone(String otpSessionToken) {
        if (otpSessionToken == null || otpSessionToken.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(otpService.resolveVerifiedPhone(otpSessionToken));
        } catch (BusinessException e) {
            // Browsing slots never fails because a remembered session expired
            return Optional.empty();
        }
    }

    private static Map<DayOfWeek, List<TourAvailabilityDTOs.TimeWindow>> validateWeeklyHours(
            List<TourAvailabilityDTOs.DayHours> weeklyHours, int slotMinutes) {
        Map<DayOfWeek, List<TourAvailabilityDTOs.TimeWindow>> byDay = new EnumMap<>(DayOfWeek.class);
        Set<DayOfWeek> seen = EnumSet.noneOf(DayOfWeek.class);
        for (TourAvailabilityDTOs.DayHours day : weeklyHours) {
            if (!seen.add(day.dayOfWeek())) {
                throw new BusinessException(day.dayOfWeek() + " is listed more than once");
            }
            List<TourAvailabilityDTOs.TimeWindow> windows = day.windows().stream()
                    .sorted(Comparator.comparing(TourAvailabilityDTOs.TimeWindow::start))
                    .toList();
            LocalTime previousEnd = null;
            for (TourAvailabilityDTOs.TimeWindow window : windows) {
                requireOnTimeStep(window.start());
                requireOnTimeStep(window.end());
                if (!window.start().isBefore(window.end())) {
                    throw new BusinessException("Visiting hours on " + label(day.dayOfWeek()) + " must end after they start");
                }
                if (ChronoUnit.MINUTES.between(window.start(), window.end()) < slotMinutes) {
                    throw new BusinessException("Each time window on " + label(day.dayOfWeek()) + " must be at least one slot ("
                            + slotMinutes + " minutes) long");
                }
                if (previousEnd != null && window.start().isBefore(previousEnd)) {
                    throw new BusinessException("Time windows on " + label(day.dayOfWeek()) + " overlap");
                }
                previousEnd = window.end();
            }
            if (!windows.isEmpty()) {
                byDay.put(day.dayOfWeek(), windows);
            }
        }
        return byDay;
    }

    private static void requireOnTimeStep(LocalTime time) {
        if (time.getSecond() != 0 || time.getNano() != 0 || time.getMinute() % TIME_STEP_MINUTES != 0) {
            throw new BusinessException("Times must be on the hour or half hour (got " + time + ")");
        }
    }

    private static ZoneId parseZone(String timezone) {
        try {
            return ZoneId.of(timezone);
        } catch (DateTimeException e) {
            throw new BusinessException("Unknown timezone: " + timezone);
        }
    }

    private static String label(DayOfWeek day) {
        return day.name().charAt(0) + day.name().substring(1).toLowerCase();
    }

    private static TourAvailabilityDTOs.BlackoutResponse toBlackoutResponse(TourBlackoutTbl blackout) {
        return new TourAvailabilityDTOs.BlackoutResponse(blackout.getId(), blackout.getBlackoutDate(),
                blackout.getStartTime(), blackout.getEndTime(), blackout.getReason());
    }
}
