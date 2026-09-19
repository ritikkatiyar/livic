package com.livic.core.finance.service.interfaces;

import com.livic.platform.common.domain.LeaseStatus;
import com.livic.core.finance.domain.LeaseTbl;
import com.livic.core.finance.dto.LeaseSummaryDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface LeaseQueryService {
    LeaseTbl getLeaseById(UUID id);
    boolean existsByUnitId(UUID unitId);
    Optional<LeaseTbl> findByUserIdAndStatus(UUID userId, LeaseStatus status);
    List<LeaseTbl> findByUnitIdAndStatus(UUID unitId, LeaseStatus status);
    List<LeaseTbl> findActiveLeasesByProperty(UUID propertyId);
    Page<LeaseTbl> findActiveLeasesByProperty(UUID propertyId, Pageable pageable);
    Map<UUID, List<LeaseSummaryDTO>> findActiveLeasesByUnitIds(Collection<UUID> unitIds);
    boolean existsByPropertyId(UUID propertyId);
    boolean isUnitAvailableOnDate(UUID unitId, LocalDate date);
}
