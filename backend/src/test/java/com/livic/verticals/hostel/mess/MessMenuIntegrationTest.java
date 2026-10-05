package com.livic.verticals.hostel.mess;

import com.livic.core.property.domain.FacingDirection;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.domain.UnitTbl;
import com.livic.core.property.domain.UnitType;
import com.livic.core.property.repository.PropertyModuleRepository;
import com.livic.core.property.repository.PropertyRepository;
import com.livic.core.property.repository.UnitRepository;
import com.livic.core.property.service.interfaces.BlockService;
import com.livic.core.property.service.interfaces.UnitMemberService;
import com.livic.platform.auth.repository.PermissionRepository;
import com.livic.platform.common.domain.UserRole;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.repository.UserRepository;
import com.livic.verticals.hostel.mess.domain.DietType;
import com.livic.verticals.hostel.mess.dto.DayMenuRequest;
import com.livic.verticals.hostel.mess.dto.MealRequest;
import com.livic.verticals.hostel.mess.dto.MealSlotRequest;
import com.livic.verticals.hostel.mess.dto.MealSlotResponse;
import com.livic.verticals.hostel.mess.dto.MenuItemRequest;
import com.livic.verticals.hostel.mess.dto.MessMenuResponse;
import com.livic.verticals.hostel.mess.dto.UpdateMealSlotsRequest;
import com.livic.verticals.hostel.mess.dto.UpdateMessSettingsRequest;
import com.livic.verticals.hostel.mess.dto.UpdateWeekMenuRequest;
import com.livic.verticals.hostel.mess.repository.MessMenuItemRepository;
import com.livic.verticals.hostel.mess.security.MessPermissions;
import com.livic.verticals.hostel.mess.service.interfaces.MessMenuService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class MessMenuIntegrationTest {

    @Autowired private MessMenuService messMenuService;
    @Autowired private MessMenuItemRepository itemRepository;
    @Autowired private PropertyModuleRepository propertyModuleRepository;
    @Autowired private PermissionRepository permissionRepository;
    @Autowired private UnitMemberService unitMemberService;
    @Autowired private BlockService blockService;
    @Autowired private UserRepository userRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private UnitRepository unitRepository;

    private UUID ownerId;
    private UUID tenantId;
    private UUID propertyId;

    @BeforeEach
    void setUp() {
        ownerId = saveUser("owner").getId();
        UserTbl tenant = saveUser("tenant");
        tenantId = tenant.getId();

        PropertyTbl property = propertyRepository.save(PropertyTbl.builder()
                .name("Mess Test PG")
                .address("12 Test Road")
                .city("Bengaluru")
                .build());
        propertyId = property.getId();

        UnitTbl unit = unitRepository.save(UnitTbl.builder()
                .property(property)
                .block(blockService.getOrCreateDefaultBlock(property))
                .unitNumber("101")
                .floor(1)
                .capacity(2)
                .gridX(1)
                .gridY(1)
                .type(UnitType.STUDIO)
                .facing(FacingDirection.NORTH)
                .build());

        // The mess menu only needs residency, which is the unit membership a lease would create
        unitMemberService.addTenant(unit.getId(), tenantId, LocalDate.now().minusDays(10), null);
    }

    private UserTbl saveUser(String prefix) {
        return userRepository.save(UserTbl.builder()
                .authUid(prefix + "-" + UUID.randomUUID() + "@test.com")
                .fullName(prefix)
                .phoneNumber("+91" + (9000000000L + (long) (Math.random() * 999999999)))
                .failedLoginAttempts(0)
                .globalRole(UserRole.USER)
                .build());
    }

    private MessMenuResponse saveSlots(MealSlotRequest... slots) {
        return messMenuService.updateSlots(propertyId, new UpdateMealSlotsRequest(List.of(slots)), ownerId);
    }

    private static UUID slotId(MessMenuResponse menu, String name) {
        return menu.slots().stream().filter(s -> s.name().equals(name)).findFirst().orElseThrow().id();
    }

    @Test
    @DisplayName("A resident sees the menu only while the property has the mess switched on")
    void residentSeesMenuWhenEnabled() {
        MessMenuResponse menu = saveSlots(
                new MealSlotRequest(null, "Breakfast", LocalTime.of(7, 30), LocalTime.of(9, 30)),
                new MealSlotRequest(null, "Dinner", LocalTime.of(20, 0), LocalTime.of(22, 0)));
        messMenuService.updateWeek(propertyId, new UpdateWeekMenuRequest(List.of(
                new DayMenuRequest(DayOfWeek.MONDAY, "Fresh fruit today", List.of(
                        new MealRequest(slotId(menu, "Breakfast"), List.of(new MenuItemRequest("Idli", DietType.VEG))))))), ownerId);

        assertFalse(messMenuService.getMyMenu(tenantId).enabled());

        messMenuService.updateSettings(propertyId, new UpdateMessSettingsRequest(true), ownerId);
        MessMenuResponse residentMenu = messMenuService.getMyMenu(tenantId);
        assertTrue(residentMenu.enabled());
        assertEquals(propertyId, residentMenu.propertyId());
        assertEquals("Fresh fruit today", residentMenu.days().get(0).note());
        assertEquals("Idli", residentMenu.days().get(0).meals().get(0).items().get(0).name());
        assertEquals(LocalTime.of(7, 30), residentMenu.slots().get(0).startTime());

        assertFalse(messMenuService.getMyMenu(ownerId).enabled());
    }

    @Test
    @DisplayName("Toggling the mess off, on and off again keeps a single module row")
    void toggleKeepsOneRow() {
        messMenuService.updateSettings(propertyId, new UpdateMessSettingsRequest(false), ownerId);
        messMenuService.updateSettings(propertyId, new UpdateMessSettingsRequest(true), ownerId);
        MessMenuResponse menu = messMenuService.updateSettings(propertyId, new UpdateMessSettingsRequest(false), ownerId);

        assertFalse(menu.enabled());
        assertTrue(propertyModuleRepository.findByPropertyIdAndModuleName(propertyId, "MESS").isPresent());
        assertFalse(messMenuService.getMenu(propertyId).enabled());
    }

    @Test
    @DisplayName("Two slots can swap names in one save")
    void swapSlotNames() {
        MessMenuResponse menu = saveSlots(new MealSlotRequest(null, "Lunch", null, null), new MealSlotRequest(null, "Dinner", null, null));
        UUID lunchId = slotId(menu, "Lunch");
        UUID dinnerId = slotId(menu, "Dinner");

        MessMenuResponse swapped = saveSlots(new MealSlotRequest(lunchId, "Dinner", null, null), new MealSlotRequest(dinnerId, "Lunch", null, null));

        assertEquals(List.of(lunchId, dinnerId), swapped.slots().stream().map(MealSlotResponse::id).toList());
        assertEquals(List.of("Dinner", "Lunch"), swapped.slots().stream().map(MealSlotResponse::name).toList());
    }

    @Test
    @DisplayName("Deleting a slot removes its items from every day")
    void deletingSlotRemovesItems() {
        MessMenuResponse menu = saveSlots(new MealSlotRequest(null, "Lunch", null, null), new MealSlotRequest(null, "Snacks", null, null));
        UUID lunchId = slotId(menu, "Lunch");
        UUID snacksId = slotId(menu, "Snacks");
        messMenuService.updateWeek(propertyId, new UpdateWeekMenuRequest(List.of(
                new DayMenuRequest(DayOfWeek.TUESDAY, null, List.of(
                        new MealRequest(lunchId, List.of(new MenuItemRequest("Dal rice", DietType.VEG))),
                        new MealRequest(snacksId, List.of(new MenuItemRequest("Samosa", DietType.VEG))))))), ownerId);

        MessMenuResponse afterDelete = saveSlots(new MealSlotRequest(lunchId, "Lunch", null, null));

        assertEquals(1, afterDelete.slots().size());
        assertEquals(List.of("Dal rice"), itemRepository.findByPropertyIdOrderBySortOrderAsc(propertyId).stream()
                .map(item -> item.getName()).toList());
    }

    @Test
    @DisplayName("Saving the same week twice replaces it rather than adding to it")
    void replaceWeekTwice() {
        UUID lunchId = slotId(saveSlots(new MealSlotRequest(null, "Lunch", null, null)), "Lunch");
        UpdateWeekMenuRequest week = new UpdateWeekMenuRequest(List.of(
                new DayMenuRequest(DayOfWeek.SUNDAY, "Sunday special", List.of(
                        new MealRequest(lunchId, List.of(new MenuItemRequest("Chicken biryani", DietType.NON_VEG)))))));

        messMenuService.updateWeek(propertyId, week, ownerId);
        MessMenuResponse menu = messMenuService.updateWeek(propertyId, week, ownerId);

        assertEquals(1, itemRepository.findByPropertyIdOrderBySortOrderAsc(propertyId).size());
        assertEquals("Sunday special", menu.days().get(6).note());
        assertEquals(DietType.NON_VEG, menu.days().get(6).meals().get(0).items().get(0).dietType());
    }

    @Test
    @DisplayName("The mess permission codes are registered, so custom-access grants are never dropped")
    void messPermissionsAreRegistered() {
        Set<String> codes = Set.of(MessPermissions.MESS_VIEW, MessPermissions.MESS_MANAGE);
        Set<String> registered = permissionRepository.findByCodeIn(codes).stream()
                .map(p -> p.getCode())
                .collect(Collectors.toSet());

        assertEquals(codes, registered);
    }
}
