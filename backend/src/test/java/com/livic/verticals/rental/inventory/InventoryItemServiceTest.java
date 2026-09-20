package com.livic.verticals.rental.inventory;

import com.livic.verticals.rental.inventory.dto.CreateInventoryItemRequest;
import com.livic.verticals.rental.inventory.dto.InventoryItemResponse;
import com.livic.verticals.rental.inventory.dto.TenantVisibleInventoryResponse;
import com.livic.verticals.rental.lease.dto.LeaseSummaryDTO;
import com.livic.verticals.rental.lease.facade.LeaseFacade;
import com.livic.verticals.rental.inventory.domain.InventoryItemTbl;
import com.livic.verticals.rental.inventory.domain.enums.InventoryCategory;
import com.livic.verticals.rental.inventory.domain.enums.InventoryCondition;
import com.livic.verticals.rental.inventory.domain.enums.InventoryScope;
import com.livic.verticals.rental.inventory.domain.enums.InventoryStatus;
import com.livic.verticals.rental.inventory.repository.InventoryItemRepository;
import com.livic.verticals.rental.inventory.service.impl.InventoryItemServiceImpl;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.platform.common.enums.OwnerModule;
import com.livic.platform.storage.facade.StorageFacade;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryItemServiceTest {

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    @Mock
    private StorageFacade storageFacade;

    @Mock
    private PropertyFacade propertyFacade;

    @Mock
    private LeaseFacade leaseFacade;

    @InjectMocks
    private InventoryItemServiceImpl itemService;

    private UUID propertyId;
    private UUID unitId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        propertyId = UUID.randomUUID();
        unitId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @Test
    @DisplayName("createItem successfully creates an inventory item")
    void testCreateItem() {
        when(propertyFacade.existsPropertyById(propertyId)).thenReturn(true);
        when(inventoryItemRepository.save(any(InventoryItemTbl.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateInventoryItemRequest request = new CreateInventoryItemRequest(
                propertyId,
                unitId,
                "Samsung Refrigerator",
                InventoryCategory.APPLIANCES,
                "SAM-1234",
                "RF-28",
                InventoryScope.UNIT_PRIVATE,
                InventoryCondition.EXCELLENT,
                InventoryStatus.AVAILABLE,
                LocalDate.now(),
                LocalDate.now().plusYears(2),
                LocalDate.now().plusMonths(6),
                BigDecimal.valueOf(86000),
                "Brand new fridge"
        );

        InventoryItemResponse response = itemService.createItem(request, userId);

        assertThat(response).isNotNull();
        assertThat(response.name()).isEqualTo("Samsung Refrigerator");
        assertThat(response.category()).isEqualTo("Appliances");
        assertThat(response.condition()).isEqualTo("Excellent");
        assertThat(response.status()).isEqualTo("Available");
        assertThat(response.value()).isEqualByComparingTo(BigDecimal.valueOf(86000));
    }

    @Test
    @DisplayName("getTenantVisibleItems returns only shared items and tenant's active unit items")
    void testGetTenantVisibleItems() {
        LeaseSummaryDTO lease = new LeaseSummaryDTO(
                UUID.randomUUID(),
                unitId,
                "101",
                1,
                propertyId,
                "Sunset Heights",
                userId,
                "ACTIVE",
                LocalDate.now(),
                LocalDate.now().plusMonths(11),
                BigDecimal.valueOf(25000)
        );
        when(leaseFacade.getActiveLeaseForUser(userId)).thenReturn(Optional.of(lease));

        InventoryItemTbl sharedItem = InventoryItemTbl.builder()
                .id(UUID.randomUUID())
                .propertyId(propertyId)
                .name("Roof HVAC")
                .category(InventoryCategory.HVAC)
                .scope(InventoryScope.PROPERTY_SHARED)
                .currentCondition(InventoryCondition.GOOD)
                .status(InventoryStatus.SHARED)
                .replacementValue(BigDecimal.valueOf(200000))
                .build();

        InventoryItemTbl unitItem = InventoryItemTbl.builder()
                .id(UUID.randomUUID())
                .propertyId(propertyId)
                .unitId(unitId)
                .name("Living Room Sofa")
                .category(InventoryCategory.FURNITURE)
                .scope(InventoryScope.UNIT_PRIVATE)
                .currentCondition(InventoryCondition.EXCELLENT)
                .status(InventoryStatus.ASSIGNED)
                .replacementValue(BigDecimal.valueOf(45000))
                .build();

        when(inventoryItemRepository.findAllByPropertyIdAndScope(propertyId, InventoryScope.PROPERTY_SHARED))
                .thenReturn(List.of(sharedItem));
        when(inventoryItemRepository.findAllByPropertyIdAndUnitId(propertyId, unitId))
                .thenReturn(List.of(unitItem));
        when(storageFacade.getAssetsForReferences(eq(OwnerModule.INVENTORY), any(Set.class)))
                .thenReturn(Map.of());

        TenantVisibleInventoryResponse response = itemService.getTenantVisibleItems(userId, propertyId);

        assertThat(response).isNotNull();
        assertThat(response.sharedItems()).hasSize(1);
        assertThat(response.sharedItems().get(0).name()).isEqualTo("Roof HVAC");
        assertThat(response.unitItems()).hasSize(1);
        assertThat(response.unitItems().get(0).name()).isEqualTo("Living Room Sofa");
    }
}
