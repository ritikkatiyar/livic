package com.livic.verticals.rental.lease.security;

import com.livic.platform.auth.spi.ResourceScope;
import com.livic.platform.auth.spi.ResourceScopeResolver;
import com.livic.platform.common.enums.ResourceType;
import com.livic.verticals.rental.lease.facade.LeaseFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Resolves a lease to the property and tenant it belongs to.
 *
 * <p>This used to sit in core's finance resolver. It moved with the lease: core may not read
 * one, and a bill now delegates here rather than the other way round.
 */
@Component
@RequiredArgsConstructor
public class LeaseResourceScopeResolver implements ResourceScopeResolver {

    private final LeaseFacade leaseFacade;

    @Override
    public Set<ResourceType> supportedTypes() {
        return Set.of(ResourceType.LEASE);
    }

    @Override
    public Optional<ResourceScope> resolve(ResourceType type, UUID resourceId) {
        if (type != ResourceType.LEASE) {
            return Optional.empty();
        }
        return leaseFacade.getLeaseById(resourceId)
                .map(lease -> new ResourceScope.Property(lease.propertyId(), lease.userId()));
    }
}
