package com.livic.core.property.security;

import com.livic.core.property.facade.UnitFacade;
import com.livic.platform.auth.spi.ResourceScope;
import com.livic.platform.auth.spi.ResourceScopeResolver;
import com.livic.platform.auth.spi.ResourceType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** A property is its own scope; a unit sits under its property. */
@Component
@RequiredArgsConstructor
public class PropertyResourceScopeResolver implements ResourceScopeResolver {

    private final UnitFacade unitFacade;

    @Override
    public Set<ResourceType> supportedTypes() {
        return Set.of(PropertyResources.PROPERTY, PropertyResources.UNIT);
    }

    @Override
    public Optional<ResourceScope> resolve(ResourceType type, UUID resourceId) {
        if (PropertyResources.PROPERTY.equals(type)) {
            return Optional.of(new ResourceScope.Property(resourceId, null));
        }
        return unitFacade.getUnitById(resourceId)
                .map(unit -> new ResourceScope.Property(unit.propertyId(), null));
    }
}
