package com.livic.services.property.service.interfaces;

import com.livic.services.property.domain.UnitMemberRole;
import com.livic.services.property.domain.UnitMemberTbl;
import com.livic.services.property.dto.UnitResidentDTO;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Who belongs to a unit. Tenants are kept in step with their lease by the rental module;
 * owners and family members are assigned directly.
 */
public interface UnitMemberService {

    /** Adds the tenant of a lease, or reuses the row if it already exists. */
    UnitMemberTbl addTenant(UUID unitId, UUID userId, UUID leaseId, LocalDate from, UUID assignedBy);

    /** Ends the member row behind a lease when the tenancy ends. */
    void endTenancy(UUID leaseId, LocalDate on);

    UnitMemberTbl addMember(UUID unitId, UUID userId, UnitMemberRole role, boolean isPrimary,
                            LocalDate from, UUID assignedBy);

    void endMember(UUID memberId, LocalDate on);

    List<UnitMemberTbl> findActiveByUnitId(UUID unitId);

    List<UnitMemberTbl> findActiveByUnitIds(Collection<UUID> unitIds);

    List<UnitMemberTbl> findActiveByUserId(UUID userId);

    List<UnitMemberTbl> findActiveByPropertyId(UUID propertyId);

    Optional<UnitMemberTbl> findActiveByLeaseId(UUID leaseId);

    /** Active members of a property, with each unit's floor, for targeting notices. */
    List<UnitResidentDTO> findActiveResidentsByPropertyId(UUID propertyId);

    /** Every unit a person is currently attached to, primary first. */
    List<UnitResidentDTO> findActiveResidencesByUserId(UUID userId);

    boolean isActiveMember(UUID userId, UUID unitId, UnitMemberRole role);
}
