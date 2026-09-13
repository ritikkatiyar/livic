package com.livic.platform.auth.service.impl;

import com.livic.platform.auth.domain.MembershipTbl;
import com.livic.platform.auth.repository.MembershipRepository;
import com.livic.platform.auth.service.interfaces.MembershipCrudService;
import com.livic.platform.common.enums.AccessType;
import com.livic.platform.common.service.impl.AbstractCrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class MembershipCrudServiceImpl extends AbstractCrudService<MembershipTbl, UUID, MembershipRepository> implements MembershipCrudService {

    public MembershipCrudServiceImpl(MembershipRepository membershipRepository) {
        super(membershipRepository);
    }

    @Override
    public List<MembershipTbl> findByUserId(UUID userId) {
        return repository.findByUserId(userId);
    }

    @Override
    public List<MembershipTbl> findByPropertyId(UUID propertyId) {
        return repository.findByPropertyId(propertyId);
    }

    @Override
    public Page<MembershipTbl> findByPropertyId(UUID propertyId, Pageable pageable) {
        return repository.findByPropertyId(propertyId, pageable);
    }

    @Override
    public Optional<MembershipTbl> findByUserIdAndPropertyId(UUID userId, UUID propertyId) {
        return repository.findByUserIdAndPropertyId(userId, propertyId);
    }

    @Override
    public Optional<MembershipTbl> findByUserIdAndPropertyIdAndIsActiveTrue(UUID userId, UUID propertyId) {
        return repository.findByUserIdAndPropertyIdAndIsActiveTrue(userId, propertyId);
    }

    @Override
    public boolean existsByUserIdAndPropertyId(UUID userId, UUID propertyId) {
        return repository.existsByUserIdAndPropertyId(userId, propertyId);
    }

    @Override
    public Set<String> findPermissionCodesByUserIdAndPropertyId(UUID userId, UUID propertyId) {
        return repository.findPermissionCodesByUserIdAndPropertyId(userId, propertyId);
    }

    @Override
    public boolean existsByUserIdAndPropertyIdAndAccessType(UUID userId, UUID propertyId, AccessType accessType) {
        return repository.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, accessType);
    }

    @Override
    public List<UUID> findPropertyIdsByUserId(UUID userId) {
        return repository.findPropertyIdsByUserId(userId);
    }

    @Override
    public List<MembershipTbl> findByPropertyIdAndAccessType(UUID propertyId, AccessType accessType) {
        return repository.findByPropertyIdAndAccessType(propertyId, accessType);
    }

    @Override
    public void deleteByPropertyId(UUID propertyId) {
        repository.deleteByPropertyId(propertyId);
    }
}
