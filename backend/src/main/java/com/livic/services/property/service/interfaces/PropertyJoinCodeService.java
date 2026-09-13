package com.livic.services.property.service.interfaces;

import com.livic.platform.common.enums.AccessType;
import com.livic.services.property.dto.PropertyJoinCodeDTOs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Set;
import java.util.UUID;

public interface PropertyJoinCodeService {
    PropertyJoinCodeDTOs.JoinCodeResponse generateJoinCode(UUID propertyId, String title, AccessType accessType, Set<String> permissionCodes, int maxUses, UUID actorId);
    Page<PropertyJoinCodeDTOs.JoinCodeResponse> getPropertyJoinCodes(UUID propertyId, Pageable pageable);
    PropertyJoinCodeDTOs.JoinCodeResultResponse validateAndApplyJoinCode(String code, UUID userId);
}
