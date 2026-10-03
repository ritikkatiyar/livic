package com.livic.core.property.repository;

import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.domain.UnitMemberTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UnitMemberRepository extends JpaRepository<UnitMemberTbl, UUID> {

    List<UnitMemberTbl> findByUnitIdAndIsActiveTrue(UUID unitId);

    List<UnitMemberTbl> findByUnitIdInAndIsActiveTrue(Collection<UUID> unitIds);

    List<UnitMemberTbl> findByUserIdAndIsActiveTrue(UUID userId);


    List<UnitMemberTbl> findByUnitIdAndRoleAndIsActiveTrue(UUID unitId, UnitMemberRole role);

    boolean existsByUnitIdAndUserIdAndRoleAndIsActiveTrue(UUID unitId, UUID userId, UnitMemberRole role);

    boolean existsByUnitId(UUID unitId);

    @Query("""
            SELECT COUNT(m) > 0 FROM UnitMemberTbl m
            WHERE m.unitId IN (SELECT u.id FROM UnitTbl u WHERE u.property.id = :propertyId)
            """)
    boolean existsByPropertyId(@Param("propertyId") UUID propertyId);

    /** Active members of a property's units, with the unit's place in the building. */
    @Query("""
            SELECT new com.livic.core.property.dto.UnitResidentDTO(
                m.id, m.userId, m.role, u.id, u.unitNumber, u.floor, u.property.id)
            FROM UnitMemberTbl m, UnitTbl u
            WHERE m.unitId = u.id AND m.isActive = true AND u.property.id = :propertyId
            """)
    List<UnitResidentDTO> findActiveResidentsByPropertyId(@Param("propertyId") UUID propertyId);

    /** Every unit a person is currently attached to, in any role. */
    @Query("""
            SELECT new com.livic.core.property.dto.UnitResidentDTO(
                m.id, m.userId, m.role, u.id, u.unitNumber, u.floor, u.property.id)
            FROM UnitMemberTbl m, UnitTbl u
            WHERE m.unitId = u.id AND m.isActive = true AND m.userId = :userId
            ORDER BY m.isPrimary DESC, m.fromDate DESC
            """)
    List<UnitResidentDTO> findActiveResidencesByUserId(@Param("userId") UUID userId);

    /**
     * Members by id regardless of whether they are still active — a bill outlives the
     * tenancy that produced it, so finance must still be able to name its payer.
     */
    @Query("""
            SELECT new com.livic.core.property.dto.UnitResidentDTO(
                m.id, m.userId, m.role, u.id, u.unitNumber, u.floor, u.property.id)
            FROM UnitMemberTbl m, UnitTbl u
            WHERE m.unitId = u.id AND m.id IN :memberIds
            """)
    List<UnitResidentDTO> findResidentsByMemberIds(@Param("memberIds") Collection<UUID> memberIds);

    /** Members of these units, past and present — a bill outlives the tenancy. */
    @Query("SELECT m.id FROM UnitMemberTbl m WHERE m.unitId IN :unitIds")
    List<UUID> findMemberIdsByUnitIds(@Param("unitIds") Collection<UUID> unitIds);

    /** Members belonging to these people, past and present. */
    @Query("SELECT m.id FROM UnitMemberTbl m WHERE m.userId IN :userIds")
    List<UUID> findMemberIdsByUserIds(@Param("userIds") Collection<UUID> userIds);

    /** Active members of every unit in a property, for notices and resident lookups. */
    @Query("""
            SELECT m FROM UnitMemberTbl m
            WHERE m.isActive = true
              AND m.unitId IN (SELECT u.id FROM UnitTbl u WHERE u.property.id = :propertyId)
            """)
    List<UnitMemberTbl> findActiveByPropertyId(@Param("propertyId") UUID propertyId);
}
