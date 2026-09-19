package com.livic.verticals.rental.inventory.security;

import com.livic.platform.auth.spi.ResourceScope;
import com.livic.platform.auth.spi.ResourceScopeResolver;
import com.livic.platform.common.enums.ResourceType;
import com.livic.verticals.rental.inventory.facade.InventoryFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class InventoryResourceScopeResolver implements ResourceScopeResolver {

    private final InventoryFacade inventoryFacade;

    @Override
    public Set<ResourceType> supportedTypes() {
        return Set.of(ResourceType.INVENTORY_ITEM, ResourceType.INVENTORY_ASSIGNMENT);
    }

    @Override
    public Optional<ResourceScope> resolve(ResourceType type, UUID resourceId) {
        return switch (type) {
            case INVENTORY_ITEM -> inventoryFacade.getPropertyIdForInventoryItem(resourceId)
                    .map(propertyId -> new ResourceScope.Property(propertyId, null));
            // Assignments inherit access from their lease
            case INVENTORY_ASSIGNMENT -> inventoryFacade.getLeaseIdForAssignment(resourceId)
                    .map(leaseId -> new ResourceScope.Delegated(ResourceType.LEASE, leaseId, null));
            default -> Optional.empty();
        };
    }
}
