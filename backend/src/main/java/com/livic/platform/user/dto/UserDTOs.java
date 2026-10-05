package com.livic.platform.user.dto;

import com.livic.platform.common.domain.UserRole;
import com.livic.platform.user.domain.UserTbl;

import java.util.UUID;

public class UserDTOs {

    public record UserSearchResponse(
            UUID id,
            String email,
            String fullName,
            String phoneNumber,
            /** Whether the person confirmed this number with a code; shown, not yet required. */
            boolean phoneVerified,
            UserRole globalRole
    ) {
        public static UserSearchResponse from(UserTbl user) {
            return new UserSearchResponse(
                    user.getId(),
                    user.getAuthUid(),
                    user.getFullName(),
                    user.getPhoneNumber(),
                    user.getPhoneVerifiedAt() != null,
                    user.getGlobalRole()
            );
        }
    }

    public record ProfileResponse(
            UUID userId,
            String fullName,
            String email,
            String phone
    ) {
        public static ProfileResponse from(UserTbl user) {
            return new ProfileResponse(
                    user.getId(),
                    user.getFullName(),
                    user.getAuthUid(),
                    user.getPhoneNumber()
            );
        }
    }

    public record UpdateProfileRequest(
            String phone
    ) {}

    public record RegisterDeviceTokenRequest(
            @jakarta.validation.constraints.NotBlank String expoPushToken,
            @jakarta.validation.constraints.NotNull com.livic.platform.user.domain.DevicePlatform platform
    ) {}
}
