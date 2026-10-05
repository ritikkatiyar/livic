package com.livic.core.property.facade;

import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.dto.UnitMemberSummaryDTO;
import com.livic.core.property.dto.UnitResidentDTO;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Who belongs to a unit, for modules outside property. A vertical adds the tenants it has an
 * agreement with through {@link #addTenant} and keeps the returned member id; core never knows
 * what the agreement is.
 */
public interface UnitMemberFacade {

    UnitMemberSummaryDTO addTenant(UUID unitId, UUID userId, LocalDate from, UUID assignedBy);

    /** Ends a membership, e.g. when the tenancy behind it ends. */
    void endMembership(UUID memberId, LocalDate on);

    List<UnitMemberSummaryDTO> getActiveMembersByPropertyId(UUID propertyId);

    /** Active members of a property, with each unit's floor, for targeting notices. */
    List<UnitResidentDTO> getActiveResidentsByPropertyId(UUID propertyId);

    /**
     * A member by id, active or ended, with its unit and property. Bills outlive tenancies,
     * so finance must be able to resolve the payer of an old bill.
     */
    Optional<UnitResidentDTO> getResidentByMemberId(UUID memberId);

    /** The same, in bulk, for rent rolls and statements. */
    List<UnitResidentDTO> getResidentsByMemberIds(Collection<UUID> memberIds);

    /** Member ids for these units or people, past and present, for filtering bills. */
    List<UUID> getMemberIdsByUnitIds(Collection<UUID> unitIds);

    List<UUID> getMemberIdsByUserIds(Collection<UUID> userIds);


    /** Every unit a person is currently attached to, primary first. */
    List<UnitResidentDTO> getActiveResidencesByUserId(UUID userId);

    boolean isActiveMember(UUID userId, UUID unitId, UnitMemberRole role);
}
