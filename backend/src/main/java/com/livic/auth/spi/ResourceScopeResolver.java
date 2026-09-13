package com.livic.auth.spi;

import com.livic.common.enums.ResourceType;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Implemented by each module that owns an authorizable {@link ResourceType}.
 * Lets the auth module resolve where a resource lives without depending on the owning module.
 */
public interface ResourceScopeResolver {

    Set<ResourceType> supportedTypes();

    Optional<ResourceScope> resolve(ResourceType type, UUID resourceId);
}
