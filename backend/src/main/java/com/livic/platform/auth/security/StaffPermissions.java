package com.livic.platform.auth.security;

import com.livic.platform.auth.spi.PermissionCatalogContributor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/** Permissions on a property's staff and their access. */
@Component
@Order(80)
public class StaffPermissions implements PermissionCatalogContributor {

    public static final String STAFF_VIEW = "STAFF_VIEW";
    public static final String MANAGE_STAFF = "MANAGE_STAFF";

    @Override
    public String module() {
        return "STAFF";
    }

    @Override
    public List<Permission> permissions() {
        return List.of(
                new Permission(STAFF_VIEW, "View Staff", "View staff members on the property"),
                new Permission(MANAGE_STAFF, "Manage Staff", "Invite staff and manage their access")
        );
    }
}
