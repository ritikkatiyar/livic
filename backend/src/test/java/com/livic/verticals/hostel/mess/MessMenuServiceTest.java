package com.livic.verticals.hostel.mess;

import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.platform.common.exception.BusinessException;
import com.livic.verticals.hostel.mess.domain.DietType;
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
import com.livic.verticals.hostel.mess.repository.MessDayNoteRepository;
import com.livic.verticals.hostel.mess.repository.MessMealSlotRepository;
import com.livic.verticals.hostel.mess.repository.MessMenuItemRepository;
import com.livic.verticals.hostel.mess.service.impl.MessMenuServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessMenuServiceTest {

    @Mock private MessMealSlotRepository slotRepository;
    @Mock private MessMenuItemRepository itemRepository;
    @Mock private MessDayNoteRepository noteRepository;
    @Mock private PropertyFacade propertyFacade;
    @Mock private UnitMemberFacade unitMemberFacade;
    @InjectMocks private MessMenuServiceImpl service;

    private final UUID propertyId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private final UUID breakfastId = UUID.randomUUID();
    private final UUID dinnerId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        lenient().when(propertyFacade.existsPropertyById(propertyId)).thenReturn(true);
    }

    private MessMealSlotTbl slot(UUID id, String name, int order) {
        MessMealSlotTbl slot = MessMealSlotTbl.builder().propertyId(propertyId).name(name).sortOrder(order).build();
        slot.setId(id);
        return slot;
    }

    private MessMenuItemTbl item(DayOfWeek day, UUID slotId, String name, int order) {
        return MessMenuItemTbl.builder().propertyId(propertyId).dayOfWeek(day).slotId(slotId)
                .name(name).sortOrder(order).build();
    }

    private UnitResidentDTO residence(UUID residencePropertyId) {
        return new UnitResidentDTO(UUID.randomUUID(), userId, UnitMemberRole.TENANT,
                UUID.randomUUID(), "101", 1, residencePropertyId);
    }

    private static UpdateWeekMenuRequest week(DayMenuRequest... days) {
        return new UpdateWeekMenuRequest(List.of(days));
    }

    @Test
    @DisplayName("The menu lists all seven days, Monday first, with every slot on every day")
    void menuCoversTheWholeWeek() {
        when(propertyFacade.isModuleActive(propertyId, "MESS")).thenReturn(true);
        when(slotRepository.findByPropertyIdOrderBySortOrderAsc(propertyId))
                .thenReturn(List.of(slot(breakfastId, "Breakfast", 0), slot(dinnerId, "Dinner", 1)));
        when(itemRepository.findByPropertyIdOrderBySortOrderAsc(propertyId)).thenReturn(List.of(
                item(DayOfWeek.SUNDAY, dinnerId, "Biryani", 0),
                item(DayOfWeek.MONDAY, breakfastId, "Poha", 0),
                item(DayOfWeek.MONDAY, breakfastId, "Tea", 1)));
        when(noteRepository.findByPropertyId(propertyId)).thenReturn(List.of(
                MessDayNoteTbl.builder().propertyId(propertyId).dayOfWeek(DayOfWeek.SUNDAY).note("Sunday special").build()));

        MessMenuResponse menu = service.getMenu(propertyId);

        assertTrue(menu.enabled());
        assertEquals(List.of(DayOfWeek.values()), menu.days().stream().map(d -> d.dayOfWeek()).toList());
        assertTrue(menu.days().stream().allMatch(d -> d.meals().size() == 2));
        assertEquals(List.of("Poha", "Tea"), menu.days().get(0).meals().get(0).items().stream().map(i -> i.name()).toList());
        assertTrue(menu.days().get(0).meals().get(1).items().isEmpty());
        assertNull(menu.days().get(0).note());
        assertEquals("Sunday special", menu.days().get(6).note());
        assertEquals("Biryani", menu.days().get(6).meals().get(1).items().get(0).name());
    }

    @Test
    @DisplayName("An unknown property is a 404")
    void unknownProperty() {
        UUID missing = UUID.randomUUID();
        when(propertyFacade.existsPropertyById(missing)).thenReturn(false);

        BusinessException error = assertThrows(BusinessException.class, () -> service.getMenu(missing));
        assertEquals(HttpStatus.NOT_FOUND, error.getStatus());
    }

    @Test
    @DisplayName("Switching the mess on stores the MESS module for the property")
    void togglesModule() {
        MessMenuResponse menu = service.updateSettings(propertyId, new UpdateMessSettingsRequest(true), userId);

        verify(propertyFacade).setModuleActive(propertyId, "MESS", true);
        assertTrue(menu.enabled());
    }

    // --- Slots -------------------------------------------------------------------------------------------------

    @Test
    @DisplayName("Saving slots deletes the ones left out, updates the kept ones and adds new ones in list order")
    void replacesSlots() {
        UUID lunchId = UUID.randomUUID();
        when(slotRepository.findIdsByPropertyId(propertyId)).thenReturn(List.of(breakfastId, lunchId, dinnerId));
        when(slotRepository.findByPropertyIdOrderBySortOrderAsc(propertyId))
                .thenReturn(List.of(slot(breakfastId, "Breakfast", 0), slot(dinnerId, "Dinner", 2)));

        service.updateSlots(propertyId, new UpdateMealSlotsRequest(List.of(
                new MealSlotRequest(dinnerId, " Supper ", LocalTime.of(20, 0), LocalTime.of(21, 30)),
                new MealSlotRequest(null, "Bed tea", null, null),
                new MealSlotRequest(breakfastId, "Breakfast", null, null))), userId);

        InOrder order = inOrder(slotRepository);
        order.verify(slotRepository).deleteByPropertyIdAndIdIn(propertyId, Set.of(lunchId));
        order.verify(slotRepository).findByPropertyIdOrderBySortOrderAsc(propertyId);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<MessMealSlotTbl>> saved = ArgumentCaptor.forClass(List.class);
        order.verify(slotRepository).saveAll(saved.capture());

        List<MessMealSlotTbl> slots = saved.getValue();
        assertEquals(List.of("Supper", "Bed tea", "Breakfast"), slots.stream().map(MessMealSlotTbl::getName).toList());
        assertEquals(List.of(0, 1, 2), slots.stream().map(MessMealSlotTbl::getSortOrder).toList());
        assertEquals(dinnerId, slots.get(0).getId());
        assertEquals(LocalTime.of(20, 0), slots.get(0).getStartTime());
        assertNull(slots.get(1).getId());
    }

    @Test
    @DisplayName("Nothing is deleted when every saved slot is kept")
    void keepsAllSlots() {
        when(slotRepository.findIdsByPropertyId(propertyId)).thenReturn(List.of(breakfastId));
        when(slotRepository.findByPropertyIdOrderBySortOrderAsc(propertyId)).thenReturn(List.of(slot(breakfastId, "Breakfast", 0)));

        service.updateSlots(propertyId, new UpdateMealSlotsRequest(List.of(
                new MealSlotRequest(breakfastId, "Breakfast", null, null))), userId);

        verify(slotRepository, never()).deleteByPropertyIdAndIdIn(eq(propertyId), anyCollection());
    }

    @Test
    @DisplayName("Two slots can't share a name, whatever the case or spacing")
    void rejectsDuplicateSlotNames() {
        UpdateMealSlotsRequest request = new UpdateMealSlotsRequest(List.of(
                new MealSlotRequest(null, "Lunch", null, null),
                new MealSlotRequest(null, " lunch", null, null)));

        BusinessException error = assertThrows(BusinessException.class, () -> service.updateSlots(propertyId, request, userId));
        assertEquals("There are two meals called lunch", error.getMessage());
        verify(slotRepository, never()).saveAll(anyCollection());
    }

    @Test
    @DisplayName("A slot needs both times or neither, and must end after it starts")
    void rejectsBadSlotTimes() {
        assertThrows(BusinessException.class, () -> service.updateSlots(propertyId, new UpdateMealSlotsRequest(List.of(
                new MealSlotRequest(null, "Lunch", LocalTime.of(13, 0), null))), userId));
        assertThrows(BusinessException.class, () -> service.updateSlots(propertyId, new UpdateMealSlotsRequest(List.of(
                new MealSlotRequest(null, "Lunch", LocalTime.of(14, 0), LocalTime.of(13, 0)))), userId));
    }

    @Test
    @DisplayName("A slot id from another property, or one already deleted, is rejected")
    void rejectsUnknownSlotId() {
        when(slotRepository.findIdsByPropertyId(propertyId)).thenReturn(List.of(breakfastId));

        assertThrows(BusinessException.class, () -> service.updateSlots(propertyId, new UpdateMealSlotsRequest(List.of(
                new MealSlotRequest(UUID.randomUUID(), "Lunch", null, null))), userId));
        verify(slotRepository, never()).deleteByPropertyIdAndIdIn(eq(propertyId), anyCollection());
    }

    // --- Week --------------------------------------------------------------------------------------------------

    @Test
    @DisplayName("Saving the week deletes the old items and notes before saving the new ones")
    void replacesWeek() {
        when(slotRepository.findIdsByPropertyId(propertyId)).thenReturn(List.of(breakfastId, dinnerId));

        service.updateWeek(propertyId, week(
                new DayMenuRequest(DayOfWeek.MONDAY, "  ", List.of(new MealRequest(breakfastId, List.of(
                        new MenuItemRequest(" Poha ", DietType.VEG),
                        new MenuItemRequest("Boiled egg", DietType.EGG))))),
                new DayMenuRequest(DayOfWeek.SUNDAY, " Sunday special ", List.of(new MealRequest(dinnerId, List.of(
                        new MenuItemRequest("Chicken biryani", DietType.NON_VEG)))))), userId);

        InOrder order = inOrder(itemRepository, noteRepository);
        order.verify(itemRepository).deleteByPropertyId(propertyId);
        order.verify(noteRepository).deleteByPropertyId(propertyId);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<MessMenuItemTbl>> items = ArgumentCaptor.forClass(List.class);
        order.verify(itemRepository).saveAll(items.capture());
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<MessDayNoteTbl>> notes = ArgumentCaptor.forClass(List.class);
        order.verify(noteRepository).saveAll(notes.capture());

        assertEquals(List.of("Poha", "Boiled egg", "Chicken biryani"), items.getValue().stream().map(MessMenuItemTbl::getName).toList());
        assertEquals(List.of(0, 1, 0), items.getValue().stream().map(MessMenuItemTbl::getSortOrder).toList());
        assertEquals(DietType.EGG, items.getValue().get(1).getDietType());
        assertEquals(1, notes.getValue().size());
        assertEquals("Sunday special", notes.getValue().get(0).getNote());
        assertEquals(DayOfWeek.SUNDAY, notes.getValue().get(0).getDayOfWeek());
    }

    @Test
    @DisplayName("A day can appear only once in the week")
    void rejectsDuplicateDays() {
        when(slotRepository.findIdsByPropertyId(propertyId)).thenReturn(List.of(breakfastId));

        BusinessException error = assertThrows(BusinessException.class, () -> service.updateWeek(propertyId, week(
                new DayMenuRequest(DayOfWeek.MONDAY, null, List.of()),
                new DayMenuRequest(DayOfWeek.MONDAY, null, List.of())), userId));
        assertEquals("Monday is listed more than once", error.getMessage());
        verify(itemRepository, never()).deleteByPropertyId(propertyId);
    }

    @Test
    @DisplayName("A meal slot can appear only once per day")
    void rejectsRepeatedSlotInADay() {
        when(slotRepository.findIdsByPropertyId(propertyId)).thenReturn(List.of(breakfastId));

        assertThrows(BusinessException.class, () -> service.updateWeek(propertyId, week(
                new DayMenuRequest(DayOfWeek.MONDAY, null, List.of(
                        new MealRequest(breakfastId, List.of()),
                        new MealRequest(breakfastId, List.of())))), userId));
    }

    @Test
    @DisplayName("Items can only go into this property's own meal slots")
    void rejectsForeignSlot() {
        when(slotRepository.findIdsByPropertyId(propertyId)).thenReturn(List.of(breakfastId));

        assertThrows(BusinessException.class, () -> service.updateWeek(propertyId, week(
                new DayMenuRequest(DayOfWeek.MONDAY, null, List.of(
                        new MealRequest(UUID.randomUUID(), List.of(new MenuItemRequest("Poha", null)))))), userId));
        verify(itemRepository, never()).deleteByPropertyId(propertyId);
    }

    // --- Residents ---------------------------------------------------------------------------------------------

    @Test
    @DisplayName("Someone who lives nowhere gets a disabled, empty menu")
    void noResidence() {
        when(unitMemberFacade.getActiveResidencesByUserId(userId)).thenReturn(List.of());
        when(propertyFacade.getPropertyIdsWithActiveModule(List.of(), "MESS")).thenReturn(Set.of());

        MessMenuResponse menu = service.getMyMenu(userId);

        assertFalse(menu.enabled());
        assertTrue(menu.days().isEmpty());
        assertTrue(menu.slots().isEmpty());
    }

    @Test
    @DisplayName("A resident whose property has the mess off gets a disabled, empty menu")
    void messOff() {
        when(unitMemberFacade.getActiveResidencesByUserId(userId)).thenReturn(List.of(residence(propertyId)));
        when(propertyFacade.getPropertyIdsWithActiveModule(List.of(propertyId), "MESS")).thenReturn(Set.of());

        MessMenuResponse menu = service.getMyMenu(userId);

        assertFalse(menu.enabled());
        verify(slotRepository, never()).findByPropertyIdOrderBySortOrderAsc(propertyId);
    }

    @Test
    @DisplayName("A resident of two properties sees the first one that has the mess on")
    void picksHomeWithMess() {
        UUID primaryHome = UUID.randomUUID();
        when(unitMemberFacade.getActiveResidencesByUserId(userId))
                .thenReturn(List.of(residence(primaryHome), residence(propertyId)));
        when(propertyFacade.getPropertyIdsWithActiveModule(List.of(primaryHome, propertyId), "MESS"))
                .thenReturn(Set.of(propertyId));
        when(slotRepository.findByPropertyIdOrderBySortOrderAsc(propertyId)).thenReturn(List.of(slot(breakfastId, "Breakfast", 0)));
        when(itemRepository.findByPropertyIdOrderBySortOrderAsc(propertyId)).thenReturn(List.of());
        when(noteRepository.findByPropertyId(propertyId)).thenReturn(List.of());

        MessMenuResponse menu = service.getMyMenu(userId);

        assertTrue(menu.enabled());
        assertEquals(propertyId, menu.propertyId());
        assertEquals(7, menu.days().size());
        verify(propertyFacade, never()).isModuleActive(eq(propertyId), anyString());
    }
}
