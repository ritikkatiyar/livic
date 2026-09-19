package com.livic.verticals.rental.inventory.controller;

import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.common.enums.ResourceType;
import com.livic.platform.common.response.ApiResponse;
import com.livic.verticals.rental.inventory.domain.enums.InventoryScope;
import com.livic.verticals.rental.inventory.domain.enums.InventoryStatus;
import com.livic.verticals.rental.inventory.dto.CreateInventoryItemRequest;
import com.livic.verticals.rental.inventory.dto.InventoryItemResponse;
import com.livic.verticals.rental.inventory.dto.InventoryStatsResponse;
import com.livic.verticals.rental.inventory.dto.ServiceExpenseRequest;
import com.livic.verticals.rental.inventory.dto.ServiceExpenseResponse;
import com.livic.verticals.rental.inventory.dto.TenantVisibleInventoryResponse;
import com.livic.verticals.rental.inventory.dto.UpdateInventoryItemRequest;
import com.livic.verticals.rental.inventory.service.interfaces.InventoryItemService;
import com.livic.verticals.rental.inventory.service.interfaces.InventoryServiceExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryItemService inventoryItemService;
    private final InventoryServiceExpenseService serviceExpenseService;

    @GetMapping("/properties/{propertyId}/items")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'INVENTORY_VIEW')")
    public ResponseEntity<ApiResponse<List<InventoryItemResponse>>> listPropertyItems(
            @PathVariable UUID propertyId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) InventoryStatus status,
            @RequestParam(required = false) InventoryScope scope,
            @RequestParam(required = false) Boolean serviceDueOnly) {
        List<InventoryItemResponse> items = inventoryItemService.listItemsByProperty(
                propertyId, q, status, scope, serviceDueOnly
        );
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @PostMapping("/items")
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId(), 'INVENTORY_MANAGE')")
    public ResponseEntity<ApiResponse<InventoryItemResponse>> createItem(
            @Valid @RequestBody CreateInventoryItemRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        InventoryItemResponse response = inventoryItemService.createItem(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PutMapping("/items/{itemId}")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).INVENTORY_ITEM, #itemId, 'INVENTORY_MANAGE')")
    public ResponseEntity<ApiResponse<InventoryItemResponse>> updateItem(
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateInventoryItemRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        InventoryItemResponse response = inventoryItemService.updateItem(itemId, request, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/items/{itemId}")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).INVENTORY_ITEM, #itemId, 'INVENTORY_VIEW')")
    public ResponseEntity<ApiResponse<InventoryItemResponse>> getItem(@PathVariable UUID itemId) {
        return ResponseEntity.ok(ApiResponse.success(inventoryItemService.getItem(itemId)));
    }

    @PostMapping("/items/{itemId}/service-expenses")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).INVENTORY_ITEM, #itemId, 'INVENTORY_MANAGE')")
    public ResponseEntity<ApiResponse<ServiceExpenseResponse>> recordServiceExpense(
            @PathVariable UUID itemId,
            @Valid @RequestBody ServiceExpenseRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        ServiceExpenseResponse response = serviceExpenseService.recordExpense(itemId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping("/items/{itemId}/service-expenses")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).INVENTORY_ITEM, #itemId, 'INVENTORY_VIEW')")
    public ResponseEntity<ApiResponse<List<ServiceExpenseResponse>>> listServiceExpenses(@PathVariable UUID itemId) {
        return ResponseEntity.ok(ApiResponse.success(serviceExpenseService.listExpensesByItem(itemId)));
    }

    @GetMapping("/properties/{propertyId}/stats")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'INVENTORY_VIEW')")
    public ResponseEntity<ApiResponse<InventoryStatsResponse>> getPropertyStats(@PathVariable UUID propertyId) {
        return ResponseEntity.ok(ApiResponse.success(inventoryItemService.getInventoryStats(propertyId)));
    }

    @GetMapping("/my-visible-items")
    @PreAuthorize("hasAnyRole('TENANT', 'LANDLORD', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<ApiResponse<TenantVisibleInventoryResponse>> getTenantVisibleItems(
            @RequestParam(required = false) UUID propertyId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        TenantVisibleInventoryResponse response = inventoryItemService.getTenantVisibleItems(userId, propertyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
