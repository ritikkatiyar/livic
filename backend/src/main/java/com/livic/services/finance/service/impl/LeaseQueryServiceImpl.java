package com.livic.services.finance.service.impl;

import com.livic.platform.common.domain.LeaseStatus;
import com.livic.platform.common.exception.BusinessException;
import com.livic.services.finance.domain.LeaseTbl;
import com.livic.services.finance.dto.LeaseSummaryDTO;
import com.livic.services.finance.service.interfaces.LeaseCrudService;
import com.livic.services.finance.service.interfaces.LeaseQueryService;
import com.livic.services.property.dto.UnitSummaryDTO;
import com.livic.services.property.facade.UnitFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
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
public class LeaseQueryServiceImpl implements LeaseQueryService {

    private final LeaseCrudService leaseCrudService;
    private final UnitFacade unitFacade;

    @Override
    public LeaseTbl getLeaseById(UUID id) {
        return leaseCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Lease not found"));
    }

    @Override
    public boolean existsByUnitId(UUID unitId) {
        return leaseCrudService.existsByUnitId(unitId);
    }

    @Override
    public Optional<LeaseTbl> findByUserIdAndStatus(UUID userId, LeaseStatus status) {
        return leaseCrudService.findByUserIdAndStatus(userId, status);
    }

    @Override
    public List<LeaseTbl> findByUnitIdAndStatus(UUID unitId, LeaseStatus status) {
        return leaseCrudService.findByUnitIdAndStatus(unitId, status).stream().toList();
    }

    @Override
    public List<LeaseTbl> findActiveLeasesByProperty(UUID propertyId) {
        List<UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        List<UUID> unitIds = units.stream().map(UnitSummaryDTO::id).toList();
        if (unitIds.isEmpty()) return List.of();
        return leaseCrudService.findByUnitIdInAndStatus(unitIds, LeaseStatus.ACTIVE);
    }

    @Override
    public Page<LeaseTbl> findActiveLeasesByProperty(UUID propertyId, Pageable pageable) {
        List<UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        List<UUID> unitIds = units.stream().map(UnitSummaryDTO::id).toList();
        if (unitIds.isEmpty()) return Page.empty(pageable);
        return leaseCrudService.findByUnitIdInAndStatus(unitIds, LeaseStatus.ACTIVE, pageable);
    }

    @Override
    public Map<UUID, List<LeaseSummaryDTO>> findActiveLeasesByUnitIds(Collection<UUID> unitIds) {
        if (unitIds == null || unitIds.isEmpty()) return Collections.emptyMap();
        return leaseCrudService.findByUnitIdInAndStatus(unitIds, LeaseStatus.ACTIVE)
                .stream()
                .collect(Collectors.groupingBy(
                        LeaseTbl::getUnitId,
                        Collectors.mapping(l -> LeaseSummaryDTO.from(l, null), Collectors.toList())
                ));
    }

    @Override
    public boolean existsByPropertyId(UUID propertyId) {
        List<UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        List<UUID> unitIds = units.stream().map(UnitSummaryDTO::id).toList();
        if (unitIds.isEmpty()) return false;
        return leaseCrudService.existsByUnitIdIn(unitIds);
    }

    @Override
    public boolean isUnitAvailableOnDate(UUID unitId, LocalDate date) {
        UnitSummaryDTO unit = unitFacade.getUnitById(unitId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit not found"));
        boolean isOccupied = leaseCrudService.existsActiveLeaseOnDate(unitId, LeaseStatus.ACTIVE, date);
        return !isOccupied;
    }
}
