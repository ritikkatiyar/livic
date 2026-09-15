package com.livic.platform.auth.repository;

import com.livic.platform.auth.domain.MembershipPermissionTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface MembershipPermissionRepository extends JpaRepository<MembershipPermissionTbl, UUID> {

    List<MembershipPermissionTbl> findByMembershipId(UUID membershipId);

    // Fetch joins so callers outside a transaction (e.g. the memberships list endpoint) can read codes without a session.
    @Query("SELECT mp FROM MembershipPermissionTbl mp JOIN FETCH mp.membership JOIN FETCH mp.permission WHERE mp.membership.id IN :membershipIds")
    List<MembershipPermissionTbl> findByMembershipIdIn(@Param("membershipIds") Collection<UUID> membershipIds);

    @Query("SELECT mp.permission.code FROM MembershipPermissionTbl mp WHERE mp.membership.id = :membershipId")
    Set<String> findPermissionCodesByMembershipId(@Param("membershipId") UUID membershipId);

    @Query("SELECT CASE WHEN COUNT(mp) > 0 THEN TRUE ELSE FALSE END FROM MembershipPermissionTbl mp " +
           "WHERE mp.membership.id = :membershipId AND mp.permission.code = :permissionCode")
    boolean existsByMembershipIdAndPermissionCode(@Param("membershipId") UUID membershipId, @Param("permissionCode") String permissionCode);

    void deleteByMembershipId(UUID membershipId);
}
