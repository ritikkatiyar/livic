package com.livic.verticals.rental.inventory.security;

import com.livic.platform.auth.spi.PermissionCatalogContributor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/** Permissions on inventory items and their assignment to leases. */
@Component
@Order(40)
public class InventoryPermissions implements PermissionCatalogContributor {

    public static final String INVENTORY_VIEW = "INVENTORY_VIEW";
    public static final String INVENTORY_MANAGE = "INVENTORY_MANAGE";

    @Override
    public String module() {
        return "INVENTORY";
    }

    @Override
    public List<Permission> permissions() {
        return List.of(
                new Permission(INVENTORY_VIEW, "View Inventory", "View inventory items"),
                new Permission(INVENTORY_MANAGE, "Manage Inventory", "Add, edit and remove inventory items")
        );
    }
}
