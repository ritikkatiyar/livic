package com.livic.verticals.rental.lease.facade.impl;

import com.livic.verticals.rental.lease.dto.LeaseSummaryDTO;
import com.livic.verticals.rental.lease.facade.LeaseFacade;
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

    private final LeaseFacade leaseFacade;

    @Override
    public Map<UUID, List<UnitOccupant>> activeOccupantsByUnitIds(Collection<UUID> unitIds) {
        return leaseFacade.getActiveLeasesByUnitIds(unitIds).entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, entry -> entry.getValue().stream()
                        .map(lease -> new UnitOccupant(lease.id(), lease.userId(), lease.rentAmount(), lease.status()))
                        .toList()));
    }

    @Override
    public Set<UUID> vacatingUnitIds(UUID propertyId) {
        return leaseFacade.getActiveLeasesByPropertyId(propertyId).stream()
                .filter(lease -> lease.moveOutDate() != null && lease.unitId() != null)
                .map(LeaseSummaryDTO::unitId)
                .collect(Collectors.toSet());
    }

    @Override
    public boolean isUnitAvailableOnDate(UUID unitId, java.time.LocalDate date) {
        return !leaseFacade.isUnitOccupiedOnDate(unitId, date);
    }

    @Override
    public boolean hasLeasesForUnit(UUID unitId) {
        return leaseFacade.hasLeasesForUnit(unitId);
    }

    @Override
    public boolean hasLeasesForProperty(UUID propertyId) {
        return leaseFacade.hasLeasesForProperty(propertyId);
    }
}
