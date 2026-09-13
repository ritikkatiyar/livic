package com.livic.services.property.security;

import com.livic.platform.auth.spi.ResourceScope;
import com.livic.platform.auth.spi.ResourceScopeResolver;
import com.livic.platform.common.enums.ResourceType;
import com.livic.services.property.facade.UnitFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PropertyResourceScopeResolver implements ResourceScopeResolver {

    private final UnitFacade unitFacade;

    @Override
    public Set<ResourceType> supportedTypes() {
        return Set.of(ResourceType.UNIT);
    }

    @Override
    public Optional<ResourceScope> resolve(ResourceType type, UUID resourceId) {
        return unitFacade.getUnitById(resourceId)
                .map(unit -> new ResourceScope.Property(unit.propertyId(), null));
    }
}
