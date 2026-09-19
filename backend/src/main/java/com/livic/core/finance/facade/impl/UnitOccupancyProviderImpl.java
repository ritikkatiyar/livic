package com.livic.core.finance.facade.impl;

import com.livic.core.finance.dto.LeaseSummaryDTO;
import com.livic.core.finance.facade.FinanceFacade;
import com.livic.core.property.spi.UnitOccupancyProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UnitOccupancyProviderImpl implements UnitOccupancyProvider {

    private final FinanceFacade financeFacade;

    @Override
    public Map<UUID, List<UnitOccupant>> activeOccupantsByUnitIds(Collection<UUID> unitIds) {
        return financeFacade.getActiveLeasesByUnitIds(unitIds).entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, entry -> entry.getValue().stream()
                        .map(lease -> new UnitOccupant(lease.id(), lease.userId(), lease.rentAmount(), lease.status()))
                        .toList()));
    }

    @Override
    public Set<UUID> vacatingUnitIds(UUID propertyId) {
        return financeFacade.getActiveLeasesByPropertyId(propertyId).stream()
                .filter(lease -> lease.moveOutDate() != null && lease.unitId() != null)
                .map(LeaseSummaryDTO::unitId)
                .collect(Collectors.toSet());
    }

    @Override
    public boolean hasLeasesForUnit(UUID unitId) {
        return financeFacade.hasLeasesForUnit(unitId);
    }

    @Override
    public boolean hasLeasesForProperty(UUID propertyId) {
        return financeFacade.hasLeasesForProperty(propertyId);
    }
}
