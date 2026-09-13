package com.livic.platform.auth.spi;

import com.livic.platform.common.enums.ResourceType;

import java.util.UUID;

/**
 * Where an authorizable resource lives, as reported by its owning module.
 */
public sealed interface ResourceScope {

    /** Resource sits directly under a property. {@code ownerUserId} is optional. */
    record Property(UUID propertyId, UUID ownerUserId) implements ResourceScope {
    }

    /**
     * Resource inherits access from a parent resource (e.g. inventory assignment → lease).
     * {@code parentType}/{@code parentId} may be null when the parent is unknown; such a resource
     * resolves to no property. {@code ownerUserId} is optional.
     */
    record Delegated(ResourceType parentType, UUID parentId, UUID ownerUserId) implements ResourceScope {
    }
}
