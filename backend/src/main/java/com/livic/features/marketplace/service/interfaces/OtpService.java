package com.livic.features.marketplace.service.interfaces;

import com.livic.features.marketplace.dto.OtpDTOs;

public interface OtpService {

    OtpDTOs.OtpRequestResponse requestOtp(OtpDTOs.OtpRequestRequest request);

    OtpDTOs.OtpVerifyResponse verifyOtp(OtpDTOs.OtpVerifyRequest request);

    void validateSessionToken(String sessionToken, String prospectPhone);

    /** Validates a verified, unexpired OTP session and returns the phone number it was issued for. */
    String resolveVerifiedPhone(String sessionToken);
}
