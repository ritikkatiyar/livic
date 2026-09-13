package com.livic.platform.auth.service.impl;

import com.livic.platform.auth.domain.MembershipTbl;
import com.livic.platform.auth.service.interfaces.MembershipCrudService;
import com.livic.platform.auth.service.interfaces.MembershipQueryService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MembershipQueryServiceImpl implements MembershipQueryService {

    private final MembershipCrudService membershipCrudService;

    @Override
    public List<MembershipTbl> getMembershipsByPropertyId(UUID propertyId) {
        return membershipCrudService.findByPropertyId(propertyId);
    }

    @Override
    public List<MembershipTbl> getMembershipsByUserId(UUID userId) {
        return membershipCrudService.findByUserId(userId);
    }
}
