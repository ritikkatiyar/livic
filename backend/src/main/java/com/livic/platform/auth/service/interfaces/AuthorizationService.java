package com.livic.platform.auth.service.interfaces;

import com.livic.platform.common.enums.OwnerModule;
import com.livic.platform.common.enums.ResourceType;

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

    // Media Authorization
    boolean hasMediaAccess(OwnerModule ownerModule, UUID referenceId, String action);

    boolean hasMediaAssetAccess(UUID mediaAssetId, String action);
}
