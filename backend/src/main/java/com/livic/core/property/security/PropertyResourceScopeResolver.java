package com.livic.core.property.security;

import com.livic.core.property.dto.UnitMemberSummaryDTO;
import com.livic.core.property.facade.UnitFacade;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.platform.auth.spi.ResourceScope;
import com.livic.platform.auth.spi.ResourceScopeResolver;
import com.livic.platform.auth.spi.ResourceType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * A property is its own scope, held by everyone who lives in it (owners, tenants, family), so they
 * can see it without a staff permission. A unit sits under its property.
 */
@Component
@RequiredArgsConstructor
public class PropertyResourceScopeResolver implements ResourceScopeResolver {

    private final UnitFacade unitFacade;
    private final UnitMemberFacade unitMemberFacade;

    @Override
    public Set<ResourceType> supportedTypes() {
        return Set.of(PropertyResources.PROPERTY, PropertyResources.UNIT);
    }

    @Override
    public Optional<ResourceScope> resolve(ResourceType type, UUID resourceId) {
        if (PropertyResources.PROPERTY.equals(type)) {
            return Optional.of(ResourceScope.Property.heldBy(resourceId, unitMemberFacade.getActiveMembersByPropertyId(resourceId)
                    .stream().map(UnitMemberSummaryDTO::userId).toList()));
        }
        return unitFacade.getUnitById(resourceId)
                .map(unit -> ResourceScope.Property.of(unit.propertyId()));
    }
}
