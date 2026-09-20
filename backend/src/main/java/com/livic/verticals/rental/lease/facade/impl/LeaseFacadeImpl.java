package com.livic.verticals.rental.lease.facade.impl;

import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.UnitFacade;
import com.livic.platform.common.domain.LeaseStatus;
import com.livic.verticals.rental.lease.dto.LeaseSummaryDTO;
import com.livic.verticals.rental.lease.facade.LeaseFacade;
import com.livic.verticals.rental.lease.service.interfaces.LeaseCrudService;
import com.livic.verticals.rental.lease.service.interfaces.LeaseQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LeaseFacadeImpl implements LeaseFacade {

    private final LeaseQueryService leaseQueryService;
    private final LeaseCrudService leaseCrudService;
    private final UnitFacade unitFacade;

    @Override
    public boolean isUnitOccupiedOnDate(UUID unitId, LocalDate date) {
        return leaseCrudService.existsActiveLeaseOnDate(unitId, LeaseStatus.ACTIVE, date);
    }

    @Override
    public Optional<LeaseSummaryDTO> getActiveLeaseForUser(UUID userId) {
        return leaseQueryService.findByUserIdAndStatus(userId, LeaseStatus.ACTIVE)
                .map(lease -> LeaseSummaryDTO.from(lease, unitFacade.getUnitById(lease.getUnitId()).orElse(null)));
    }

    @Override
    public List<LeaseSummaryDTO> getActiveLeasesByPropertyId(UUID propertyId) {
        Map<UUID, UnitSummaryDTO> unitMap = unitFacade.getUnitsByPropertyId(propertyId).stream()
                .collect(Collectors.toMap(UnitSummaryDTO::id, u -> u));
        return leaseQueryService.findActiveLeasesByProperty(propertyId).stream()
                .map(lease -> LeaseSummaryDTO.from(lease, unitMap.get(lease.getUnitId())))
                .toList();
    }

    @Override
    public List<LeaseSummaryDTO> getActiveLeasesByUnitId(UUID unitId) {
        UnitSummaryDTO u = unitFacade.getUnitById(unitId).orElse(null);
        return leaseQueryService.findByUnitIdAndStatus(unitId, LeaseStatus.ACTIVE).stream()
                .map(lease -> LeaseSummaryDTO.from(lease, u))
                .toList();
    }

    @Override
    public Map<UUID, List<LeaseSummaryDTO>> getActiveLeasesByUnitIds(Collection<UUID> unitIds) {
        if (unitIds == null || unitIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return leaseQueryService.findActiveLeasesByUnitIds(unitIds);
    }

    @Override
    public boolean hasLeasesForProperty(UUID propertyId) {
        return leaseQueryService.existsByPropertyId(propertyId);
    }

    @Override
    public boolean hasLeasesForUnit(UUID unitId) {
        return leaseQueryService.existsByUnitId(unitId);
    }

    @Override
    public Optional<LeaseSummaryDTO> getLeaseById(UUID leaseId) {
        return leaseCrudService.findById(leaseId)
                .map(lease -> LeaseSummaryDTO.from(lease, unitFacade.getUnitById(lease.getUnitId()).orElse(null)));
    }
}
