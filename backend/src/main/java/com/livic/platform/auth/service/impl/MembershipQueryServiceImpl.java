package com.livic.platform.auth.service.impl;

import com.livic.platform.auth.domain.MembershipPermissionTbl;
import com.livic.platform.auth.domain.MembershipTbl;
import com.livic.platform.auth.dto.MembershipDTOs;
import com.livic.platform.auth.mapper.MembershipMapper;
import com.livic.platform.auth.repository.MembershipPermissionRepository;
import com.livic.platform.auth.repository.MembershipRepository;
import com.livic.platform.auth.service.interfaces.MembershipQueryService;
import com.livic.platform.common.enums.AccessType;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MembershipQueryServiceImpl implements MembershipQueryService {

    private final MembershipRepository membershipRepository;
    private final MembershipPermissionRepository membershipPermissionRepository;
    private final UserFacade userFacade;

    @Override
    public List<MembershipTbl> getMembershipsByPropertyId(UUID propertyId) {
        return membershipRepository.findByPropertyId(propertyId);
    }

    @Override
    public List<MembershipTbl> getMembershipsByUserId(UUID userId) {
        return membershipRepository.findByUserId(userId);
    }

    @Override
    public Page<MembershipDTOs.MembershipResponse> listMemberships(UUID propertyId, Pageable pageable) {
        Page<MembershipTbl> memberships = membershipRepository.findByPropertyId(propertyId, pageable);
        if (memberships.isEmpty()) {
            return Page.empty(pageable);
        }

        List<UUID> userIds = memberships.stream().map(MembershipTbl::getUserId).distinct().toList();
        Map<UUID, UserSummaryDTO> usersById = userFacade.getUsersByIds(userIds);

        List<UUID> customAccessIds = memberships.stream()
                .filter(m -> AccessType.CUSTOM_ACCESS.equals(m.getAccessType()))
                .map(MembershipTbl::getId)
                .toList();
        Map<UUID, Set<String>> permissionsById = getPermissionsByMembershipIds(customAccessIds);

        return memberships.map(m -> MembershipMapper.toMembershipResponse(
                m,
                usersById.get(m.getUserId()),
                AccessType.FULL_ACCESS.equals(m.getAccessType())
                        ? Collections.emptySet()
                        : permissionsById.getOrDefault(m.getId(), Collections.emptySet())));
    }

    @Override
    public Map<UUID, Set<String>> getPermissionsByMembershipIds(Collection<UUID> membershipIds) {
        if (membershipIds == null || membershipIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<MembershipPermissionTbl> rows = membershipPermissionRepository.findByMembershipIdIn(membershipIds);
        return rows.stream()
                .filter(mp -> mp.getMembership() != null && mp.getMembership().getId() != null && mp.getPermission() != null)
                .collect(Collectors.groupingBy(
                        mp -> mp.getMembership().getId(),
                        Collectors.mapping(mp -> mp.getPermission().getCode(), Collectors.toSet())
                ));
    }
}
