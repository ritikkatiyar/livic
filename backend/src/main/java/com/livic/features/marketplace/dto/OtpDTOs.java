package com.livic.features.marketplace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.time.Instant;

public class OtpDTOs {

    public record OtpRequestRequest(
        @NotBlank @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be a valid 10-digit number") String phone
    ) {}

    public record OtpRequestResponse(
        int expiresSeconds,
        int resendAfterSeconds
    ) {}

    public record OtpVerifyRequest(
        @NotBlank @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be a valid 10-digit number") String phone,
        @NotBlank @Pattern(regexp = "^[0-9]{6}$", message = "OTP code must be 6 digits") String code
    ) {}

    public record OtpVerifyResponse(
        String sessionToken,
        Instant expiresAt
    ) {}
}
