package com.livic.core.property.service.interfaces;

import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.domain.UnitMemberTbl;
import com.livic.core.property.dto.UnitResidentDTO;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Who belongs to a unit. A vertical adds the tenants it has an agreement with (rental, for a
 * lease) through {@link #addTenant}; owners and family members are assigned directly.
 */
public interface UnitMemberService {

    /** Adds a tenant; the vertical that holds the tenancy keeps the member's id. */
    UnitMemberTbl addTenant(UUID unitId, UUID userId, LocalDate from, UUID assignedBy);

    UnitMemberTbl addMember(UUID unitId, UUID userId, UnitMemberRole role, boolean isPrimary,
                            LocalDate from, UUID assignedBy);

    void endMember(UUID memberId, LocalDate on);

    List<UnitMemberTbl> findActiveByUnitId(UUID unitId);

    List<UnitMemberTbl> findActiveByUnitIds(Collection<UUID> unitIds);

    List<UnitMemberTbl> findActiveByUserId(UUID userId);

    List<UnitMemberTbl> findActiveByPropertyId(UUID propertyId);


    /** Active members of a property, with each unit's floor, for targeting notices. */
    List<UnitResidentDTO> findActiveResidentsByPropertyId(UUID propertyId);

    /** Members by id, active or ended — bills outlive the tenancy that produced them. */
    List<UnitResidentDTO> findResidentsByMemberIds(Collection<UUID> memberIds);

    /** Member ids for these units or people, past and present, for filtering bills. */
    List<UUID> findMemberIdsByUnitIds(Collection<UUID> unitIds);

    List<UUID> findMemberIdsByUserIds(Collection<UUID> userIds);


    /** Every unit a person is currently attached to, primary first. */
    List<UnitResidentDTO> findActiveResidencesByUserId(UUID userId);

    boolean isActiveMember(UUID userId, UUID unitId, UnitMemberRole role);

    /** Whether anyone has ever been a member of the unit; their history (bills, ledger) keeps it in place. */
    boolean hasEverHadMembers(UUID unitId);

    /** Whether anyone has ever been a member of a unit in the property. */
    boolean propertyHasEverHadMembers(UUID propertyId);
}
