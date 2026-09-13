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
            UserRole globalRole
    ) {
        public static UserSearchResponse from(UserTbl user) {
            return new UserSearchResponse(
                    user.getId(),
                    user.getAuthUid(),
                    user.getFullName(),
                    user.getPhoneNumber(),
                    user.getGlobalRole()
            );
        }
    }

    public record CreateTenantRequest(
            @jakarta.validation.constraints.Email
            @jakarta.validation.constraints.NotBlank
            String email,

            @jakarta.validation.constraints.NotBlank
            String fullName,

            @jakarta.validation.constraints.NotBlank
            String phoneNumber
    ) {}

    public record TenantProfileResponse(
            UUID userId,
            String fullName,
            String email,
            String phone
    ) {
        public static TenantProfileResponse from(UserTbl user) {
            return new TenantProfileResponse(
                    user.getId(),
                    user.getFullName(),
                    user.getAuthUid(),
                    user.getPhoneNumber()
            );
        }
    }

    public record UpdateTenantProfileRequest(
            String phone
    ) {}

    public record RegisterDeviceTokenRequest(
            @jakarta.validation.constraints.NotBlank String expoPushToken,
            @jakarta.validation.constraints.NotNull com.livic.platform.user.domain.DevicePlatform platform
    ) {}
}
