package com.livic.verticals.hostel.mess.mapper;

import com.livic.verticals.hostel.mess.domain.DietType;
import com.livic.verticals.hostel.mess.domain.MessDayNoteTbl;
import com.livic.verticals.hostel.mess.domain.MessMealSlotTbl;
import com.livic.verticals.hostel.mess.domain.MessMenuItemTbl;
import com.livic.verticals.hostel.mess.dto.DayMenuResponse;
import com.livic.verticals.hostel.mess.dto.MealResponse;
import com.livic.verticals.hostel.mess.dto.MealSlotResponse;
import com.livic.verticals.hostel.mess.dto.MenuItemResponse;
import com.livic.verticals.hostel.mess.dto.MessMenuResponse;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

public final class MessMenuMapper {

    private MessMenuMapper() {
    }

    /**
     * Lays the rows out as the full week, Monday first, with one meal per slot on every day. Days are
     * grouped through an EnumMap: the column is a varchar, so sorting on it would be alphabetical.
     */
    public static MessMenuResponse toResponse(UUID propertyId, boolean enabled, List<MessMealSlotTbl> slots,
                                              List<MessMenuItemTbl> items, List<MessDayNoteTbl> notes) {
        Map<DayOfWeek, Map<UUID, List<MenuItemResponse>>> itemsByDayAndSlot = new EnumMap<>(DayOfWeek.class);
        items.forEach(item -> itemsByDayAndSlot
                .computeIfAbsent(item.getDayOfWeek(), day -> new HashMap<>())
                .computeIfAbsent(item.getSlotId(), slotId -> new ArrayList<>())
                .add(toResponse(item)));

        Map<DayOfWeek, String> noteByDay = notes.stream()
                .collect(Collectors.toMap(MessDayNoteTbl::getDayOfWeek, MessDayNoteTbl::getNote,
                        (a, b) -> a, () -> new EnumMap<>(DayOfWeek.class)));

        List<DayMenuResponse> days = Arrays.stream(DayOfWeek.values())
                .map(day -> {
                    Map<UUID, List<MenuItemResponse>> itemsBySlot = itemsByDayAndSlot.getOrDefault(day, Map.of());
                    List<MealResponse> meals = slots.stream()
                            .map(slot -> new MealResponse(slot.getId(), itemsBySlot.getOrDefault(slot.getId(), List.of())))
                            .toList();
                    return new DayMenuResponse(day, noteByDay.get(day), meals);
                })
                .toList();

        return new MessMenuResponse(propertyId, enabled, slots.stream().map(MessMenuMapper::toResponse).toList(), days);
    }

    /** What a resident sees when they live nowhere with the mess switched on. */
    public static MessMenuResponse toDisabledResponse() {
        return new MessMenuResponse(null, false, List.of(), List.of());
    }

    public static MealSlotResponse toResponse(MessMealSlotTbl slot) {
        return new MealSlotResponse(slot.getId(), slot.getName(), slot.getStartTime(), slot.getEndTime());
    }

    public static MenuItemResponse toResponse(MessMenuItemTbl item) {
        return new MenuItemResponse(item.getId(), item.getName(), item.getDietType());
    }

    public static MessMealSlotTbl toEntity(UUID propertyId, String name, LocalTime startTime, LocalTime endTime, int sortOrder) {
        return MessMealSlotTbl.builder()
                .propertyId(propertyId)
                .name(name)
                .startTime(startTime)
                .endTime(endTime)
                .sortOrder(sortOrder)
                .build();
    }

    public static MessMenuItemTbl toEntity(UUID propertyId, DayOfWeek day, UUID slotId, String name,
                                           DietType dietType, int sortOrder) {
        return MessMenuItemTbl.builder()
                .propertyId(propertyId)
                .dayOfWeek(day)
                .slotId(slotId)
                .name(name)
                .dietType(dietType)
                .sortOrder(sortOrder)
                .build();
    }

    public static MessDayNoteTbl toEntity(UUID propertyId, DayOfWeek day, String note) {
        return MessDayNoteTbl.builder()
                .propertyId(propertyId)
                .dayOfWeek(day)
                .note(note)
                .build();
    }
}
