package com.livic.core.property.spi;

import com.livic.core.property.facade.UnitFacade;
import com.livic.platform.auth.facade.AuthFacade;
import com.livic.platform.subscription.spi.PropertyUsageProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/** Plan usage counts, reported to subscription enforcement in platform: what the user owns. */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PropertyUsageProviderImpl implements PropertyUsageProvider {

    private final AuthFacade authFacade;
    private final UnitFacade unitFacade;

    @Override
    public long countPropertiesForUser(UUID userId) {
        return authFacade.getOwnedPropertyIds(userId).size();
    }

    @Override
    public long countUnitsForUser(UUID userId) {
        return unitFacade.getTotalUnitsForPropertyIds(authFacade.getOwnedPropertyIds(userId));
    }
}
