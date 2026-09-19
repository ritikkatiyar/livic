package com.livic.core.property.spi;

import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.property.facade.UnitFacade;
import com.livic.platform.subscription.spi.PropertyUsageProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Plan usage counts, reported to subscription enforcement in platform. */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PropertyUsageProviderImpl implements PropertyUsageProvider {

    private final PropertyFacade propertyFacade;
    private final UnitFacade unitFacade;

    @Override
    public long countPropertiesForUser(UUID userId) {
        return propertyFacade.getPropertiesByUserId(userId, Pageable.unpaged()).getTotalElements();
    }

    @Override
    public long countUnitsForUser(UUID userId) {
        List<UUID> propertyIds = propertyFacade.getPropertiesByUserId(userId, Pageable.unpaged())
                .getContent().stream()
                .map(PropertySummaryDTO::id)
                .toList();
        return unitFacade.getTotalUnitsForPropertyIds(propertyIds);
    }
}
