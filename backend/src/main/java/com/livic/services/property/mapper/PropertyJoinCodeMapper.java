package com.livic.services.property.mapper;

import com.livic.services.property.domain.PropertyJoinCodeTbl;
import com.livic.services.property.dto.PropertyJoinCodeDTOs;

import java.util.Set;
import java.util.UUID;

public class PropertyJoinCodeMapper {

    private PropertyJoinCodeMapper() {
        // Private constructor to prevent instantiation
    }

    public static PropertyJoinCodeDTOs.JoinCodeResponse toResponse(PropertyJoinCodeTbl jc) {
        if (jc == null) {
            return null;
        }
        Set<String> perms = jc.getPermissionCodes() != null
                ? jc.getPermissionCodes()
                : Set.of();

        return new PropertyJoinCodeDTOs.JoinCodeResponse(
                jc.getId(),
                jc.getCode(),
                jc.getTitle(),
                jc.getAccessType(),
                jc.getMaxUses(),
                jc.getUsesCount(),
                jc.isActive(),
                jc.getExpiresAt(),
                perms
        );
    }

    public static PropertyJoinCodeDTOs.JoinCodeResultResponse toResultResponse(
            UUID propertyId,
            String propertyName,
            String title,
            com.livic.platform.common.enums.AccessType accessType,
            UUID membershipId
    ) {
        return new PropertyJoinCodeDTOs.JoinCodeResultResponse(
                propertyId,
                propertyName,
                title,
                accessType,
                membershipId
        );
    }
}
