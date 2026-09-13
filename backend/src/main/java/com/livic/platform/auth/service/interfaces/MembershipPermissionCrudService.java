package com.livic.platform.auth.service.interfaces;

import com.livic.platform.auth.domain.MembershipPermissionTbl;
import com.livic.platform.common.service.interfaces.CrudService;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface MembershipPermissionCrudService extends CrudService<MembershipPermissionTbl, UUID> {
    List<MembershipPermissionTbl> findByMembershipId(UUID membershipId);
    List<MembershipPermissionTbl> findByMembershipIdIn(Collection<UUID> membershipIds);
    Set<String> findPermissionCodesByMembershipId(UUID membershipId);
    boolean existsByMembershipIdAndPermissionCode(UUID membershipId, String permissionCode);
    void deleteByMembershipId(UUID membershipId);
}
