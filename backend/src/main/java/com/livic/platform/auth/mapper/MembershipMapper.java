package com.livic.platform.auth.mapper;

import com.livic.platform.auth.domain.MembershipTbl;
import com.livic.platform.auth.dto.MembershipDTOs;
import com.livic.platform.auth.dto.MembershipSummaryDTO;
import com.livic.platform.user.dto.UserSummaryDTO;

import java.util.Set;

public class MembershipMapper {

    private MembershipMapper() {
        // Private constructor to prevent instantiation
    }

    public static MembershipSummaryDTO toResponse(MembershipTbl m) {
        return toResponse(m, null);
    }

    public static MembershipDTOs.MembershipResponse toMembershipResponse(
            MembershipTbl m, UserSummaryDTO user, Set<String> permissionCodes) {
        return new MembershipDTOs.MembershipResponse(
                m.getId(),
                m.getUserId(),
                user != null ? user.fullName() : "Unknown User",
                user != null && user.phoneNumber() != null ? user.phoneNumber() : "",
                m.getTitle(),
                m.getAccessType(),
                m.isActive(),
                permissionCodes
        );
    }

    public static MembershipSummaryDTO toResponse(MembershipTbl m, String propertyName) {
        if (m == null) {
            return null;
        }
        return new MembershipSummaryDTO(
                m.getId(),
                m.getPropertyId(),
                propertyName,
                m.getUserId(),
                m.getTitle(),
                m.getAccessType(),
                m.isActive()
        );
    }
}
