package com.livic.platform.auth.service.interfaces;

import com.livic.platform.auth.domain.MembershipTbl;
import com.livic.platform.auth.dto.MembershipDTOs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public interface MembershipQueryService {
    List<MembershipTbl> getMembershipsByPropertyId(UUID propertyId);
    List<MembershipTbl> getMembershipsByUserId(UUID userId);
    Page<MembershipDTOs.MembershipResponse> listMemberships(UUID propertyId, Pageable pageable);
    Map<UUID, Set<String>> getPermissionsByMembershipIds(Collection<UUID> membershipIds);
}
