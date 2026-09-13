package com.livic.features.inventory.dto;

import java.util.List;

public record TenantVisibleInventoryResponse(
        List<InventoryItemResponse> unitItems,
        List<InventoryItemResponse> sharedItems
) {}
