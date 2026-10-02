package com.livic.core.finance.security;

import com.livic.platform.auth.spi.ResourceScope;
import com.livic.platform.auth.spi.ResourceScopeResolver;
import com.livic.platform.common.enums.ResourceType;
import com.livic.core.finance.facade.FinanceFacade;
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
        return Set.of(ResourceType.BILL, ResourceType.CHARGE_CONFIG);
    }

    @Override
    public Optional<ResourceScope> resolve(ResourceType type, UUID resourceId) {
        return switch (type) {
            // A bill sits under its property, and belongs to the user who pays it: staff need a
            // property permission, the payer only the self-service one (BILL_VIEW_OWN). Owners
            // with no lease are payers too, so this must not go through a lease.
            case BILL -> financeFacade.getBillScope(resourceId)
                    .map(bill -> new ResourceScope.Property(bill.propertyId(), bill.payerUserId()));
            case CHARGE_CONFIG -> Optional.ofNullable(financeFacade.getChargeConfigById(resourceId))
                    .map(chargeConfig -> new ResourceScope.Property(chargeConfig.getPropertyId(), null));
            default -> Optional.empty();
        };
    }
}
