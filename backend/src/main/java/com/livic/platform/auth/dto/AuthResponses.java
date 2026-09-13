package com.livic.platform.auth.dto;

public final class AuthResponses {

    private AuthResponses() {}

        public record AuthUserSummary(
                        String id,
                        String email,
                        String fullName
    ) {}

        public record TokenBundle(
                        String accessToken,
                        String refreshToken,
                        String tokenType,
                        long expiresInSeconds,
            AuthUserSummary user
    ) {}

        public record SignupResponse(
                        String status,
                        String email,
                        long codeExpiresInSeconds,
                        long resendAvailableInSeconds
    ) {}

        public record ValidateResponse(
                        boolean valid,
                        String userId,
                        String email,
                        Long expiresAtEpochSeconds,
                        String message
    ) {}
}
