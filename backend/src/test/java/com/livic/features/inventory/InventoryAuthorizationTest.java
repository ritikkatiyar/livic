package com.livic.features.inventory;

import com.livic.platform.auth.AuthorizationTestSupport;
import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.auth.service.impl.AuthorizationServiceImpl;
import com.livic.platform.auth.service.interfaces.MembershipCrudService;
import com.livic.platform.common.domain.UserRole;
import com.livic.platform.common.enums.ResourceType;
import com.livic.features.inventory.controller.InventoryController;
import com.livic.features.inventory.dto.CreateInventoryItemRequest;
import com.livic.features.inventory.dto.ServiceExpenseRequest;
import com.livic.features.inventory.dto.UpdateInventoryItemRequest;
import com.livic.features.inventory.facade.InventoryFacade;
import com.livic.platform.user.dto.UserSummaryDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Method;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryAuthorizationTest {

    @Mock
    private MembershipCrudService membershipCrudService;

    @Mock
    private InventoryFacade inventoryFacade;

    private AuthorizationServiceImpl authorizationService;

    private UUID propertyId;
    private UUID itemId;
    private UUID ownerUserId;
    private UUID unrelatedUserId;

    @BeforeEach
    void setUp() {
        authorizationService = AuthorizationTestSupport.authorizationService(membershipCrudService, null, null, inventoryFacade, null);
        propertyId = UUID.randomUUID();
        itemId = UUID.randomUUID();
        ownerUserId = UUID.randomUUID();
        unrelatedUserId = UUID.randomUUID();
    }

    private void authenticateUser(UUID userId, String email) {
        UserSummaryDTO userSummary = new UserSummaryDTO(
                userId,
                email,
                "Test User",
                "+919876543210",
                UserRole.USER
        );
        UserDetailsImpl userDetails = UserDetailsImpl.fromClaims(userSummary.id().toString(), userSummary.authUid(), userSummary.globalRole().name());
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Owner with PROPERTY_EDIT and PROPERTY_VIEW permissions can access item-level endpoints")
    void ownerWithPropertyPermissions() {
        authenticateUser(ownerUserId, "owner@example.com");

        when(inventoryFacade.getPropertyIdForInventoryItem(itemId)).thenReturn(Optional.of(propertyId));
        when(membershipCrudService.findPermissionCodesByUserIdAndPropertyId(ownerUserId, propertyId))
                .thenReturn(Set.of("INVENTORY_MANAGE", "INVENTORY_VIEW"));

        assertThat(authorizationService.hasPermission(ResourceType.INVENTORY_ITEM, itemId, "INVENTORY_MANAGE")).isTrue();
        assertThat(authorizationService.hasPermission(ResourceType.INVENTORY_ITEM, itemId, "INVENTORY_VIEW")).isTrue();
    }

    @Test
    @DisplayName("Unrelated user with no membership is rejected from item-level endpoints")
    void unrelatedUserIsRejected() {
        authenticateUser(unrelatedUserId, "stranger@example.com");

        when(inventoryFacade.getPropertyIdForInventoryItem(itemId)).thenReturn(Optional.of(propertyId));
        when(membershipCrudService.findPermissionCodesByUserIdAndPropertyId(unrelatedUserId, propertyId))
                .thenReturn(Set.of());

        assertThat(authorizationService.hasPermission(ResourceType.INVENTORY_ITEM, itemId, "INVENTORY_MANAGE")).isFalse();
        assertThat(authorizationService.hasPermission(ResourceType.INVENTORY_ITEM, itemId, "INVENTORY_VIEW")).isFalse();
    }

    @Test
    @DisplayName("Verify InventoryController has strict PreAuthorize annotations configured")
    void verifyControllerPreAuthorizeAnnotations() throws NoSuchMethodException {
        Class<InventoryController> clazz = InventoryController.class;

        Method updateItem = clazz.getMethod("updateItem", UUID.class, UpdateInventoryItemRequest.class, UserDetailsImpl.class);
        PreAuthorize preAuthUpdate = updateItem.getAnnotation(PreAuthorize.class);
        assertThat(preAuthUpdate).isNotNull();
        assertThat(preAuthUpdate.value()).isEqualTo("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).INVENTORY_ITEM, #itemId, 'INVENTORY_MANAGE')");

        Method getItem = clazz.getMethod("getItem", UUID.class);
        PreAuthorize preAuthGet = getItem.getAnnotation(PreAuthorize.class);
        assertThat(preAuthGet).isNotNull();
        assertThat(preAuthGet.value()).isEqualTo("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).INVENTORY_ITEM, #itemId, 'INVENTORY_VIEW')");

        Method recordExpense = clazz.getMethod("recordServiceExpense", UUID.class, ServiceExpenseRequest.class, UserDetailsImpl.class);
        PreAuthorize preAuthExpense = recordExpense.getAnnotation(PreAuthorize.class);
        assertThat(preAuthExpense).isNotNull();
        assertThat(preAuthExpense.value()).isEqualTo("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).INVENTORY_ITEM, #itemId, 'INVENTORY_MANAGE')");

        Method listExpenses = clazz.getMethod("listServiceExpenses", UUID.class);
        PreAuthorize preAuthList = listExpenses.getAnnotation(PreAuthorize.class);
        assertThat(preAuthList).isNotNull();
        assertThat(preAuthList.value()).isEqualTo("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).INVENTORY_ITEM, #itemId, 'INVENTORY_VIEW')");

        Method getTenantVisible = clazz.getMethod("getTenantVisibleItems", UUID.class, UserDetailsImpl.class);
        PreAuthorize preAuthTenantVisible = getTenantVisible.getAnnotation(PreAuthorize.class);
        assertThat(preAuthTenantVisible).isNotNull();
        assertThat(preAuthTenantVisible.value()).isEqualTo("hasAnyRole('TENANT', 'LANDLORD', 'ADMIN', 'SUPERADMIN')");
    }
}
