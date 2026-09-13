package com.livic.user.dto;

import com.livic.common.domain.UserRole;
import com.livic.user.domain.UserTbl;

import java.time.Instant;
import java.util.UUID;

/**
 * Login credentials for the auth module. Only exposed through {@code UserFacade.findCredentialsByEmail};
 * never return this from a controller.
 */
public record UserCredentialsDTO(
        UUID id,
        String email,
        String fullName,
        String passwordHash,
        Instant lockoutUntil,
        UserRole globalRole
) {
    public static UserCredentialsDTO from(UserTbl user) {
        return new UserCredentialsDTO(
                user.getId(),
                user.getAuthUid(),
                user.getFullName(),
                user.getPasswordHash(),
                user.getLockoutUntil(),
                user.getGlobalRole()
        );
    }

    @Override
    public String toString() {
        return "UserCredentialsDTO[id=" + id + ", email=" + email + "]";
    }
}
