package com.livic.platform.auth.service.interfaces;

import com.livic.platform.auth.domain.MembershipTbl;
import com.livic.platform.common.enums.AccessType;
import com.livic.platform.common.service.interfaces.CrudService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface MembershipCrudService extends CrudService<MembershipTbl, UUID> {
    List<MembershipTbl> findByUserId(UUID userId);
    List<MembershipTbl> findByPropertyId(UUID propertyId);
    Page<MembershipTbl> findByPropertyId(UUID propertyId, Pageable pageable);
    Optional<MembershipTbl> findByUserIdAndPropertyId(UUID userId, UUID propertyId);
    Optional<MembershipTbl> findByUserIdAndPropertyIdAndIsActiveTrue(UUID userId, UUID propertyId);
    boolean existsByUserIdAndPropertyId(UUID userId, UUID propertyId);
    Set<String> findPermissionCodesByUserIdAndPropertyId(UUID userId, UUID propertyId);
    boolean existsByUserIdAndPropertyIdAndAccessType(UUID userId, UUID propertyId, AccessType accessType);
    List<UUID> findPropertyIdsByUserId(UUID userId);
    List<MembershipTbl> findByPropertyIdAndAccessType(UUID propertyId, AccessType accessType);
    void deleteByPropertyId(UUID propertyId);
}
