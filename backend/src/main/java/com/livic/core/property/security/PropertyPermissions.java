package com.livic.core.property.security;

import com.livic.platform.auth.spi.PermissionCatalogContributor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/** Permissions on a property, its blocks, floors and units. */
@Component
@Order(10)
public class PropertyPermissions implements PermissionCatalogContributor {

    public static final String PROPERTY_VIEW = "PROPERTY_VIEW";
    public static final String PROPERTY_EDIT = "PROPERTY_EDIT";
    public static final String PROPERTY_DELETE = "PROPERTY_DELETE";

    @Override
    public String module() {
        return "PROPERTY";
    }

    @Override
    public List<Permission> permissions() {
        return List.of(
                new Permission(PROPERTY_VIEW, "View Property", "View property details, units and floors"),
                new Permission(PROPERTY_EDIT, "Edit Property", "Edit property details, units and layouts"),
                new Permission(PROPERTY_DELETE, "Delete Property", "Permanently delete the property")
        );
    }
}
