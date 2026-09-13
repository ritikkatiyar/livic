package com.livic.platform.auth.service.impl;

import com.livic.platform.auth.spi.ResourceScope;
import com.livic.platform.auth.spi.ResourceScopeResolver;
import com.livic.platform.common.enums.ResourceType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Maps every {@link ResourceType} to the module resolver that owns it.
 * PROPERTY is handled here directly since a property's id is its own scope.
 */
@Slf4j
@Component
public class ResourceScopeRegistry {

    static final int MAX_DELEGATION_DEPTH = 3;

    private final Map<ResourceType, ResourceScopeResolver> resolvers = new EnumMap<>(ResourceType.class);

    public ResourceScopeRegistry(List<ResourceScopeResolver> resolverBeans) {
        for (ResourceScopeResolver resolver : resolverBeans) {
            for (ResourceType type : resolver.supportedTypes()) {
                if (type == ResourceType.PROPERTY) {
                    throw new IllegalStateException("PROPERTY is resolved by the auth module; "
                            + resolver.getClass().getName() + " must not claim it");
                }
                ResourceScopeResolver existing = resolvers.putIfAbsent(type, resolver);
                if (existing != null) {
                    throw new IllegalStateException("Duplicate ResourceScopeResolver for " + type + ": "
                            + existing.getClass().getName() + " and " + resolver.getClass().getName());
                }
            }
        }

        Set<ResourceType> missing = EnumSet.allOf(ResourceType.class);
        missing.remove(ResourceType.PROPERTY);
        missing.removeAll(resolvers.keySet());
        if (!missing.isEmpty()) {
            throw new IllegalStateException("No ResourceScopeResolver registered for " + missing);
        }
    }

    public Optional<ResourceScope> resolve(ResourceType type, UUID resourceId) {
        if (type == null || resourceId == null) {
            return Optional.empty();
        }
        if (type == ResourceType.PROPERTY) {
            return Optional.of(new ResourceScope.Property(resourceId, null));
        }
        return resolvers.get(type).resolve(type, resourceId);
    }

    /** Follows delegation links until the owning property is found. */
    public Optional<UUID> resolvePropertyId(ResourceType type, UUID resourceId) {
        ResourceType currentType = type;
        UUID currentId = resourceId;

        for (int depth = 0; depth <= MAX_DELEGATION_DEPTH; depth++) {
            Optional<ResourceScope> scope = resolve(currentType, currentId);
            if (scope.isEmpty()) {
                return Optional.empty();
            }
            switch (scope.get()) {
                case ResourceScope.Property property -> {
                    return Optional.ofNullable(property.propertyId());
                }
                case ResourceScope.Delegated delegated -> {
                    currentType = delegated.parentType();
                    currentId = delegated.parentId();
                }
            }
        }

        log.error("Resource scope delegation for {} {} exceeded max depth {}", type, resourceId, MAX_DELEGATION_DEPTH);
        return Optional.empty();
    }
}
