package com.livic.verticals.rental.inventory.security;

import com.livic.platform.auth.spi.ResourceType;

import java.util.Set;

/** The resources the inventory module authorizes. An assignment is reached through its lease. */
public final class InventoryResources {

    public static final ResourceType ITEM = new ResourceType("INVENTORY_ITEM",
            Set.of(InventoryPermissions.INVENTORY_VIEW), Set.of(InventoryPermissions.INVENTORY_MANAGE));
    public static final ResourceType ASSIGNMENT = ResourceType.named("INVENTORY_ASSIGNMENT");

    private InventoryResources() {
    }
}
