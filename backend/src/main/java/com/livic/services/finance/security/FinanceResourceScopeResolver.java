package com.livic.services.finance.security;

import com.livic.platform.auth.spi.ResourceScope;
import com.livic.platform.auth.spi.ResourceScopeResolver;
import com.livic.platform.common.enums.ResourceType;
import com.livic.services.finance.facade.FinanceFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class FinanceResourceScopeResolver implements ResourceScopeResolver {

    private final FinanceFacade financeFacade;

    @Override
    public Set<ResourceType> supportedTypes() {
        return Set.of(ResourceType.LEASE, ResourceType.RENT_CYCLE, ResourceType.CHARGE_CONFIG);
    }

    @Override
    public Optional<ResourceScope> resolve(ResourceType type, UUID resourceId) {
        return switch (type) {
            case LEASE -> financeFacade.getLeaseById(resourceId)
                    .map(lease -> new ResourceScope.Property(lease.propertyId(), lease.userId()));
            case RENT_CYCLE -> financeFacade.getPropertyIdByRentCycleId(resourceId)
                    .map(propertyId -> new ResourceScope.Property(propertyId, null));
            case CHARGE_CONFIG -> Optional.ofNullable(financeFacade.getChargeConfigById(resourceId))
                    .map(chargeConfig -> new ResourceScope.Property(chargeConfig.getPropertyId(), null));
            default -> Optional.empty();
        };
    }
}
