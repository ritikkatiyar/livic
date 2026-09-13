package com.livic.platform.auth.repository;

import com.livic.platform.auth.domain.MembershipTbl;
import com.livic.platform.common.enums.AccessType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface MembershipRepository extends JpaRepository<MembershipTbl, UUID> {
    List<MembershipTbl> findByUserId(UUID userId);
    
    @Query("SELECT m FROM MembershipTbl m WHERE m.propertyId = :propertyId AND (m.title IS NULL OR LOWER(m.title) NOT IN ('resident', 'tenant'))")
    List<MembershipTbl> findByPropertyId(@Param("propertyId") UUID propertyId);

    @Query("SELECT m FROM MembershipTbl m WHERE m.propertyId = :propertyId AND (m.title IS NULL OR LOWER(m.title) NOT IN ('resident', 'tenant'))")
    Page<MembershipTbl> findByPropertyId(@Param("propertyId") UUID propertyId, Pageable pageable);
    
    Optional<MembershipTbl> findByUserIdAndPropertyId(UUID userId, UUID propertyId);
    Optional<MembershipTbl> findByUserIdAndPropertyIdAndIsActiveTrue(UUID userId, UUID propertyId);
    
    boolean existsByUserIdAndPropertyId(UUID userId, UUID propertyId);

    @Query("SELECT p.code FROM MembershipTbl m JOIN MembershipPermissionTbl mp ON mp.membership.id = m.id JOIN PermissionTbl p ON mp.permission.id = p.id WHERE m.userId = :userId AND m.propertyId = :propertyId AND m.isActive = true")
    Set<String> findPermissionCodesByUserIdAndPropertyId(@Param("userId") UUID userId, @Param("propertyId") UUID propertyId);

    @Query("SELECT COUNT(m) > 0 FROM MembershipTbl m WHERE m.userId = :userId AND m.propertyId = :propertyId AND m.accessType = :accessType AND m.isActive = true")
    boolean existsByUserIdAndPropertyIdAndAccessType(@Param("userId") UUID userId, @Param("propertyId") UUID propertyId, @Param("accessType") AccessType accessType);

    @Query("SELECT DISTINCT m.propertyId FROM MembershipTbl m WHERE m.userId = :userId AND m.propertyId IS NOT NULL AND m.isActive = true")
    List<UUID> findPropertyIdsByUserId(@Param("userId") UUID userId);

    @Query("SELECT m FROM MembershipTbl m WHERE m.propertyId = :propertyId AND m.accessType = :accessType")
    List<MembershipTbl> findByPropertyIdAndAccessType(@Param("propertyId") UUID propertyId, @Param("accessType") AccessType accessType);

    void deleteByPropertyId(UUID propertyId);
}
