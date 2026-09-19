package com.livic.core.finance.service.interfaces;

import com.livic.platform.common.service.interfaces.CrudService;
import com.livic.core.finance.domain.UnitBookingTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface UnitBookingCrudService extends CrudService<UnitBookingTbl, UUID> {
    Optional<UnitBookingTbl> findByStatusAndConvertedLeaseId(String status, UUID convertedLeaseId);
    Page<UnitBookingTbl> findByUnitIdIn(Collection<UUID> unitIds, Pageable pageable);
    Page<UnitBookingTbl> findByProspectiveTenantUserId(UUID prospectiveTenantUserId, Pageable pageable);
    Page<UnitBookingTbl> findAll(Pageable pageable);
}
