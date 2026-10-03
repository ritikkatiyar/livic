package com.livic.platform.auth.service.interfaces;

import com.livic.platform.auth.spi.ResourceType;

import java.util.Optional;

import java.util.UUID;

public interface AuthorizationService {

    // Core Property Authorization
    boolean hasPermission(UUID propertyId, String permissionCode);

    boolean hasAnyPermission(UUID propertyId, String... permissionCodes);

    boolean hasFullAccess(UUID propertyId);

    // Generic Resource Authorization
    boolean hasPermission(ResourceType resourceType, UUID resourceId, String permissionCode);

    boolean hasAnyPermission(ResourceType resourceType, UUID resourceId, String... permissionCodes);

    boolean hasFullAccess(ResourceType resourceType, UUID resourceId);

    /** The declared resource type with that name, for references stored as text. */
    Optional<ResourceType> findResourceType(String name);
}
