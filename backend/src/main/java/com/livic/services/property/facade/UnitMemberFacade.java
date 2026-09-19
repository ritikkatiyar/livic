package com.livic.services.property.facade;

import com.livic.services.property.domain.UnitMemberRole;
import com.livic.services.property.dto.UnitMemberSummaryDTO;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Who belongs to a unit, for modules outside property. The rental module keeps tenant rows in
 * step with leases through {@link #addTenant} and {@link #endTenancy}.
 */
public interface UnitMemberFacade {

    UnitMemberSummaryDTO addTenant(UUID unitId, UUID userId, UUID leaseId, LocalDate from, UUID assignedBy);

    void endTenancy(UUID leaseId, LocalDate on);

    List<UnitMemberSummaryDTO> getActiveMembersByUnitId(UUID unitId);

    List<UnitMemberSummaryDTO> getActiveMembersByUnitIds(Collection<UUID> unitIds);

    List<UnitMemberSummaryDTO> getActiveMembersByUserId(UUID userId);

    List<UnitMemberSummaryDTO> getActiveMembersByPropertyId(UUID propertyId);

    Optional<UnitMemberSummaryDTO> getActiveMemberByLeaseId(UUID leaseId);

    boolean isActiveMember(UUID userId, UUID unitId, UnitMemberRole role);
}
