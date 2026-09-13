package com.livic.platform.auth.service.impl;

import com.livic.platform.auth.domain.MembershipPermissionTbl;
import com.livic.platform.auth.repository.MembershipPermissionRepository;
import com.livic.platform.auth.service.interfaces.MembershipPermissionCrudService;
import com.livic.platform.common.service.impl.AbstractCrudService;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class MembershipPermissionCrudServiceImpl extends AbstractCrudService<MembershipPermissionTbl, UUID, MembershipPermissionRepository>
        implements MembershipPermissionCrudService {

    public MembershipPermissionCrudServiceImpl(MembershipPermissionRepository repository) {
        super(repository);
    }

    @Override
    public List<MembershipPermissionTbl> findByMembershipId(UUID membershipId) {
        return repository.findByMembershipId(membershipId);
    }

    @Override
    public List<MembershipPermissionTbl> findByMembershipIdIn(Collection<UUID> membershipIds) {
        return repository.findByMembershipIdIn(membershipIds);
    }

    @Override
    public Set<String> findPermissionCodesByMembershipId(UUID membershipId) {
        return repository.findPermissionCodesByMembershipId(membershipId);
    }

    @Override
    public boolean existsByMembershipIdAndPermissionCode(UUID membershipId, String permissionCode) {
        return repository.existsByMembershipIdAndPermissionCode(membershipId, permissionCode);
    }

    @Override
    public void deleteByMembershipId(UUID membershipId) {
        repository.deleteByMembershipId(membershipId);
    }
}
