package com.livic.core.finance.security;

import com.livic.platform.auth.spi.ResourceScope;
import com.livic.platform.auth.spi.ResourceScopeResolver;
import com.livic.platform.auth.spi.ResourceType;
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
        return Set.of(FinanceResources.BILL, FinanceResources.CHARGE_CONFIG);
    }

    @Override
    public Optional<ResourceScope> resolve(ResourceType type, UUID resourceId) {
        return switch (type.name()) {
            // A bill sits under its property and belongs to the user who pays it, and to the owner
            // who issued it when they let their flat out: staff need a property permission, they
            // only the self-service one (BILL_VIEW_OWN). No lease is involved.
            case "BILL" -> financeFacade.getBillScope(resourceId)
                    .map(bill -> ResourceScope.Property.heldBy(bill.propertyId(), bill.payerUserId(), bill.issuerUserId()));
            case "CHARGE_CONFIG" -> Optional.ofNullable(financeFacade.getChargeConfigById(resourceId))
                    .map(chargeConfig -> ResourceScope.Property.of(chargeConfig.getPropertyId()));
            default -> Optional.empty();
        };
    }
}
