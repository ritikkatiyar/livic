package com.livic.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import jakarta.validation.constraints.Pattern;

public final class AuthRequests {

    private AuthRequests() {}

        public record SignupRequest(
                        @Email @NotBlank @Size(max = 255) String email,
                        @NotBlank 
                        @Size(min = 8, max = 128) 
                        @Pattern(
                            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#.\\-_^+=~()\\[\\]{}|\\\\:;\"'<>,/]).{8,128}$",
                            message = "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character."
                        )
                        String password,
                        @NotBlank @Size(max = 255) String fullName,
                        @Pattern(
                            regexp = "^$|^[0-9+\\-() ]{10,20}$",
                            message = "Phone number must be between 10 and 20 characters if provided."
                        )
                        @Size(max = 20) String phoneNumber
    ) {}

        public record LoginRequest(
                        @Email @NotBlank @Size(max = 255) String email,
                        @NotBlank @Size(max = 128) String password
    ) {}

        public record RefreshRequest(
                        @NotBlank String refreshToken
    ) {}

        public record LogoutRequest(
                        @NotBlank String refreshToken
    ) {}

        public record ValidateRequest(
                        @NotBlank String accessToken
    ) {}

        public record VerifyEmailRequest(
                        @Email @NotBlank @Size(max = 255) String email,
                        @NotBlank @Pattern(regexp = "^\\d{6}$", message = "Code must be 6 digits") String code
    ) {}

        public record ResendVerificationRequest(
                        @Email @NotBlank @Size(max = 255) String email
    ) {}

        public record OAuthLoginRequest(
                        @NotBlank @Size(max = 4096) String idToken
    ) {}
}
