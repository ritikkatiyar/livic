package com.livic.platform.auth.spi;

import java.util.List;

/**
 * Implemented by each module that defines permissions a staff member can be granted. The auth
 * module merges them into the catalog the staff-access screen shows and makes sure each code exists
 * in {@code permission_tbl}, so a module adds a permission without auth knowing what it means.
 *
 * <p>Self-service codes (ending in {@code _OWN}) are not declared: nobody is granted them, the user a
 * resource belongs to holds them.
 */
public interface PermissionCatalogContributor {

    /** The group these permissions are shown under, such as {@code FINANCE}. */
    String module();

    List<Permission> permissions();

    record Permission(String code, String label, String description) {
    }
}
