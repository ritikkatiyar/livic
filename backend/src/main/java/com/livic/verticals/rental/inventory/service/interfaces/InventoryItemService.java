package com.livic.verticals.rental.inventory.service.interfaces;

import com.livic.verticals.rental.inventory.dto.CreateInventoryItemRequest;
import com.livic.verticals.rental.inventory.dto.InventoryItemResponse;
import com.livic.verticals.rental.inventory.dto.InventoryStatsResponse;
import com.livic.verticals.rental.inventory.dto.TenantVisibleInventoryResponse;
import com.livic.verticals.rental.inventory.dto.UpdateInventoryItemRequest;
import com.livic.verticals.rental.inventory.domain.enums.InventoryScope;
import com.livic.verticals.rental.inventory.domain.enums.InventoryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface InventoryItemService {

    InventoryItemResponse createItem(CreateInventoryItemRequest request, UUID userId);

    InventoryItemResponse updateItem(UUID itemId, UpdateInventoryItemRequest request, UUID userId);

    InventoryItemResponse getItem(UUID itemId);

    List<InventoryItemResponse> listItemsByProperty(
            UUID propertyId, 
            String query, 
            InventoryStatus status, 
            InventoryScope scope, 
            Boolean serviceDueOnly);

    Page<InventoryItemResponse> listItemsByPropertyPaginated(UUID propertyId, Pageable pageable);

    TenantVisibleInventoryResponse getTenantVisibleItems(UUID userId, UUID propertyId);

    InventoryStatsResponse getInventoryStats(UUID propertyId);
}
