package com.livic.platform.common.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * User roles for the Tenant Living application.
 * 
 * Hierarchy:
 * - SUPER_ADMIN: System Super Administrator
 * - ADMIN: System Administrator
 * - USER: Standard platform user
 */
public enum UserRole {
    USER("User"),
    SUPER_ADMIN("SuperAdmin"),   // System Super Administrator
    ADMIN("Admin");              // System Administrator

    private final String displayName;

    UserRole(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Check if this role can create/manage properties.
     * Both SUPER_ADMIN and ADMIN can manage properties.
     */
    public boolean canManageProperties() {
        return this == SUPER_ADMIN || this == ADMIN;
    }

    /**
     * Check if this role is an owner (primary or secondary).
     */
    public boolean isOwner() {
        return this == SUPER_ADMIN || this == ADMIN;
    }

    @JsonCreator
    public static UserRole fromValue(String value) {
        for (UserRole role : values()) {
            if (role.displayName.equalsIgnoreCase(value) || role.name().equalsIgnoreCase(value)) {
                return role;
            }
        }
        throw new IllegalArgumentException("Invalid UserRole: " + value);
    }
}
