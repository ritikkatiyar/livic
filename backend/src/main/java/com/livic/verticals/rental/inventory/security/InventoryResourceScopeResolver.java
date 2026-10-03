package com.livic.verticals.rental.inventory.security;

import com.livic.platform.auth.spi.ResourceScope;
import com.livic.platform.auth.spi.ResourceScopeResolver;
import com.livic.platform.auth.spi.ResourceType;
import com.livic.verticals.rental.lease.security.LeaseResources;
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
        return Set.of(InventoryResources.ITEM, InventoryResources.ASSIGNMENT);
    }

    @Override
    public Optional<ResourceScope> resolve(ResourceType type, UUID resourceId) {
        return switch (type.name()) {
            case "INVENTORY_ITEM" -> inventoryFacade.getPropertyIdForInventoryItem(resourceId)
                    .map(propertyId -> new ResourceScope.Property(propertyId, null));
            // Assignments inherit access from their lease
            case "INVENTORY_ASSIGNMENT" -> inventoryFacade.getLeaseIdForAssignment(resourceId)
                    .map(leaseId -> new ResourceScope.Delegated(LeaseResources.LEASE, leaseId, null));
            default -> Optional.empty();
        };
    }
}
