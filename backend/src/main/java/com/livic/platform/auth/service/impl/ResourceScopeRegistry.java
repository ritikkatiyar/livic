package com.livic.platform.auth.service.impl;

import com.livic.platform.auth.spi.ResourceScope;
import com.livic.platform.auth.spi.ResourceScopeResolver;
import com.livic.platform.auth.spi.ResourceType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Maps every {@link ResourceType} the modules declare to the resolver that owns it. Auth names none
 * of them itself.
 */
@Slf4j
@Component
public class ResourceScopeRegistry {

    static final int MAX_DELEGATION_DEPTH = 3;

    private final Map<String, ResourceScopeResolver> resolvers = new HashMap<>();
    private final Map<String, ResourceType> types = new HashMap<>();

    public ResourceScopeRegistry(List<ResourceScopeResolver> resolverBeans) {
        for (ResourceScopeResolver resolver : resolverBeans) {
            for (ResourceType type : resolver.supportedTypes()) {
                ResourceScopeResolver existing = resolvers.putIfAbsent(type.name(), resolver);
                if (existing != null) {
                    throw new IllegalStateException("Duplicate ResourceScopeResolver for " + type + ": "
                            + existing.getClass().getName() + " and " + resolver.getClass().getName());
                }
                types.put(type.name(), type);
            }
        }
    }

    /** The declared type with that name, for references stored as text (such as a file's owner). */
    public Optional<ResourceType> findType(String name) {
        return Optional.ofNullable(name).map(types::get);
    }

    public Optional<ResourceScope> resolve(ResourceType type, UUID resourceId) {
        if (type == null || resourceId == null) {
            return Optional.empty();
        }
        ResourceScopeResolver resolver = resolvers.get(type.name());
        if (resolver == null) {
            log.warn("No ResourceScopeResolver declares {}", type);
            return Optional.empty();
        }
        return resolver.resolve(type, resourceId);
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
