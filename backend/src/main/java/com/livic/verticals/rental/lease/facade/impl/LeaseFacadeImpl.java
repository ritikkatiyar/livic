package com.livic.verticals.rental.lease.facade.impl;

import com.livic.verticals.rental.lease.repository.LeaseRepository;
import com.livic.core.property.facade.UnitFacade;
import com.livic.verticals.rental.lease.domain.LeaseStatus;
import com.livic.verticals.rental.lease.dto.LeaseSummaryDTO;
import com.livic.verticals.rental.lease.facade.LeaseFacade;
import com.livic.verticals.rental.lease.service.interfaces.LeaseQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LeaseFacadeImpl implements LeaseFacade {

    private final LeaseQueryService leaseQueryService;
    private final LeaseRepository leaseRepository;
    private final UnitFacade unitFacade;

    @Override
    public boolean hasVacancyOnDate(UUID unitId, LocalDate date) {
        return leaseQueryService.isUnitAvailableOnDate(unitId, date);
    }

    @Override
    public Optional<LeaseSummaryDTO> getActiveLeaseForUser(UUID userId) {
        return leaseQueryService.findByUserIdAndStatus(userId, LeaseStatus.ACTIVE)
                .map(lease -> LeaseSummaryDTO.from(lease, unitFacade.getUnitById(lease.getUnitId()).orElse(null)));
    }

    @Override
    public Optional<LeaseSummaryDTO> getLeaseById(UUID leaseId) {
        return leaseRepository.findById(leaseId)
                .map(lease -> LeaseSummaryDTO.from(lease, unitFacade.getUnitById(lease.getUnitId()).orElse(null)));
    }
}
