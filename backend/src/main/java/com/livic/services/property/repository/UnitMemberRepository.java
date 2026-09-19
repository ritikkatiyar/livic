package com.livic.services.property.repository;

import com.livic.services.property.domain.UnitMemberRole;
import com.livic.services.property.domain.UnitMemberTbl;
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

    List<UnitMemberTbl> findByUserIdAndRoleAndIsActiveTrue(UUID userId, UnitMemberRole role);

    List<UnitMemberTbl> findByUnitIdAndRoleAndIsActiveTrue(UUID unitId, UnitMemberRole role);

    Optional<UnitMemberTbl> findFirstByLeaseIdAndIsActiveTrue(UUID leaseId);

    List<UnitMemberTbl> findByLeaseId(UUID leaseId);

    boolean existsByUnitIdAndUserIdAndRoleAndIsActiveTrue(UUID unitId, UUID userId, UnitMemberRole role);

    /** Active members of every unit in a property, for notices and resident lookups. */
    @Query("""
            SELECT m FROM UnitMemberTbl m
            WHERE m.isActive = true
              AND m.unitId IN (SELECT u.id FROM UnitTbl u WHERE u.property.id = :propertyId)
            """)
    List<UnitMemberTbl> findActiveByPropertyId(@Param("propertyId") UUID propertyId);
}
