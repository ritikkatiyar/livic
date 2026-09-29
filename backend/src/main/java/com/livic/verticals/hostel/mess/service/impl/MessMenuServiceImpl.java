package com.livic.verticals.hostel.mess.service.impl;

import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.platform.common.exception.BusinessException;
import com.livic.verticals.hostel.mess.domain.MessDayNoteTbl;
import com.livic.verticals.hostel.mess.domain.MessMealSlotTbl;
import com.livic.verticals.hostel.mess.domain.MessMenuItemTbl;
import com.livic.verticals.hostel.mess.dto.DayMenuRequest;
import com.livic.verticals.hostel.mess.dto.MealRequest;
import com.livic.verticals.hostel.mess.dto.MealSlotRequest;
import com.livic.verticals.hostel.mess.dto.MenuItemRequest;
import com.livic.verticals.hostel.mess.dto.MessMenuResponse;
import com.livic.verticals.hostel.mess.dto.UpdateMealSlotsRequest;
import com.livic.verticals.hostel.mess.dto.UpdateMessSettingsRequest;
import com.livic.verticals.hostel.mess.dto.UpdateWeekMenuRequest;
import com.livic.verticals.hostel.mess.mapper.MessMenuMapper;
import com.livic.verticals.hostel.mess.repository.MessDayNoteRepository;
import com.livic.verticals.hostel.mess.repository.MessMealSlotRepository;
import com.livic.verticals.hostel.mess.repository.MessMenuItemRepository;
import com.livic.verticals.hostel.mess.service.interfaces.MessMenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessMenuServiceImpl implements MessMenuService {

    /**
     * The property module that shows the menu to residents. Not to be confused with PropertyType.MESS,
     * which marks a property that is itself a mess; any property can switch this module on.
     */
    static final String MODULE = "MESS";

    private final MessMealSlotRepository slotRepository;
    private final MessMenuItemRepository itemRepository;
    private final MessDayNoteRepository noteRepository;
    private final PropertyFacade propertyFacade;
    private final UnitMemberFacade unitMemberFacade;

    @Override
    @Transactional(readOnly = true)
    public MessMenuResponse getMenu(UUID propertyId) {
        requireProperty(propertyId);
        return loadMenu(propertyId, propertyFacade.isModuleActive(propertyId, MODULE));
    }

    @Override
    @Transactional
    public MessMenuResponse updateSettings(UUID propertyId, UpdateMessSettingsRequest request, UUID userId) {
        requireProperty(propertyId);
        propertyFacade.setModuleActive(propertyId, MODULE, request.enabled());
        log.info("mess_menu_settings_updated propertyId={} userId={} enabled={}", propertyId, userId, request.enabled());
        return loadMenu(propertyId, request.enabled());
    }

    @Override
    @Transactional
    public MessMenuResponse updateSlots(UUID propertyId, UpdateMealSlotsRequest request, UUID userId) {
        requireProperty(propertyId);
        validateSlots(request.slots());

        Set<UUID> existingIds = new HashSet<>(slotRepository.findIdsByPropertyId(propertyId));
        Set<UUID> keptIds = request.slots().stream()
                .map(MealSlotRequest::id)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (!existingIds.containsAll(keptIds)) {
            throw new BusinessException("One of these meals was removed in the meantime. Reload and try again.");
        }

        // Delete first: the bulk delete clears the persistence context, so the kept slots are loaded after it
        Set<UUID> removedIds = new HashSet<>(existingIds);
        removedIds.removeAll(keptIds);
        if (!removedIds.isEmpty()) {
            slotRepository.deleteByPropertyIdAndIdIn(propertyId, removedIds);
        }

        Map<UUID, MessMealSlotTbl> keptById = slotRepository.findByPropertyIdOrderBySortOrderAsc(propertyId).stream()
                .collect(Collectors.toMap(MessMealSlotTbl::getId, Function.identity()));
        List<MessMealSlotTbl> slots = new ArrayList<>();
        for (int order = 0; order < request.slots().size(); order++) {
            MealSlotRequest slotRequest = request.slots().get(order);
            String name = slotRequest.name().trim();
            if (slotRequest.id() == null) {
                slots.add(MessMenuMapper.toEntity(propertyId, name, slotRequest.startTime(), slotRequest.endTime(), order));
                continue;
            }
            MessMealSlotTbl slot = keptById.get(slotRequest.id());
            slot.setName(name);
            slot.setStartTime(slotRequest.startTime());
            slot.setEndTime(slotRequest.endTime());
            slot.setSortOrder(order);
            slots.add(slot);
        }
        slotRepository.saveAll(slots);

        log.info("mess_menu_slots_updated propertyId={} userId={} slots={} removed={}",
                propertyId, userId, slots.size(), removedIds.size());
        return loadMenu(propertyId, propertyFacade.isModuleActive(propertyId, MODULE));
    }

    @Override
    @Transactional
    public MessMenuResponse updateWeek(UUID propertyId, UpdateWeekMenuRequest request, UUID userId) {
        requireProperty(propertyId);
        Set<UUID> slotIds = new HashSet<>(slotRepository.findIdsByPropertyId(propertyId));

        List<MessMenuItemTbl> items = new ArrayList<>();
        List<MessDayNoteTbl> notes = new ArrayList<>();
        Set<DayOfWeek> seenDays = EnumSet.noneOf(DayOfWeek.class);
        for (DayMenuRequest day : request.days()) {
            if (!seenDays.add(day.dayOfWeek())) {
                throw new BusinessException(label(day.dayOfWeek()) + " is listed more than once");
            }
            Set<UUID> daySlotIds = new HashSet<>();
            for (MealRequest meal : day.meals()) {
                if (!slotIds.contains(meal.slotId())) {
                    throw new BusinessException("A meal on " + label(day.dayOfWeek())
                            + " is no longer on your list of meals. Reload and try again.");
                }
                if (!daySlotIds.add(meal.slotId())) {
                    throw new BusinessException("A meal is listed more than once on " + label(day.dayOfWeek()));
                }
                for (int order = 0; order < meal.items().size(); order++) {
                    MenuItemRequest item = meal.items().get(order);
                    items.add(MessMenuMapper.toEntity(propertyId, day.dayOfWeek(), meal.slotId(),
                            item.name().trim(), item.dietType(), order));
                }
            }
            if (day.note() != null && !day.note().isBlank()) {
                notes.add(MessMenuMapper.toEntity(propertyId, day.dayOfWeek(), day.note().trim()));
            }
        }

        // Replace the week: the bulk deletes run before the inserts, so a day's note never collides with itself
        itemRepository.deleteByPropertyId(propertyId);
        noteRepository.deleteByPropertyId(propertyId);
        itemRepository.saveAll(items);
        noteRepository.saveAll(notes);

        log.info("mess_menu_week_updated propertyId={} userId={} items={} notes={}",
                propertyId, userId, items.size(), notes.size());
        return loadMenu(propertyId, propertyFacade.isModuleActive(propertyId, MODULE));
    }

    @Override
    @Transactional(readOnly = true)
    public MessMenuResponse getMyMenu(UUID userId) {
        // Primary home first, so a resident attached to two properties sees the one they mainly live in
        List<UUID> homePropertyIds = unitMemberFacade.getActiveResidencesByUserId(userId).stream()
                .map(UnitResidentDTO::propertyId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Set<UUID> withMess = propertyFacade.getPropertyIdsWithActiveModule(homePropertyIds, MODULE);
        return homePropertyIds.stream()
                .filter(withMess::contains)
                .findFirst()
                .map(propertyId -> loadMenu(propertyId, true))
                .orElseGet(MessMenuMapper::toDisabledResponse);
    }

    private MessMenuResponse loadMenu(UUID propertyId, boolean enabled) {
        return MessMenuMapper.toResponse(propertyId, enabled,
                slotRepository.findByPropertyIdOrderBySortOrderAsc(propertyId),
                itemRepository.findByPropertyIdOrderBySortOrderAsc(propertyId),
                noteRepository.findByPropertyId(propertyId));
    }

    private void requireProperty(UUID propertyId) {
        if (!propertyFacade.existsPropertyById(propertyId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Property not found");
        }
    }

    private static void validateSlots(List<MealSlotRequest> slots) {
        Set<String> names = new HashSet<>();
        Set<UUID> ids = new HashSet<>();
        for (MealSlotRequest slot : slots) {
            String name = slot.name().trim();
            if (!names.add(name.toLowerCase(Locale.ROOT))) {
                throw new BusinessException("There are two meals called " + name);
            }
            if (slot.id() != null && !ids.add(slot.id())) {
                throw new BusinessException(name + " is listed more than once");
            }
            if ((slot.startTime() == null) != (slot.endTime() == null)) {
                throw new BusinessException("Give " + name + " both a start and an end time, or neither");
            }
            if (slot.startTime() != null && !slot.startTime().isBefore(slot.endTime())) {
                throw new BusinessException(name + " must end after it starts");
            }
        }
    }

    private static String label(DayOfWeek day) {
        return day.name().charAt(0) + day.name().substring(1).toLowerCase(Locale.ROOT);
    }
}
