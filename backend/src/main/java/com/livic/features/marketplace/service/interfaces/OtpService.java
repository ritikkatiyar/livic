package com.livic.features.marketplace.service.interfaces;

import com.livic.features.marketplace.dto.OtpDTOs.OtpRequestRequest;
import com.livic.features.marketplace.dto.OtpDTOs.OtpRequestResponse;
import com.livic.features.marketplace.dto.OtpDTOs.OtpVerifyRequest;
import com.livic.features.marketplace.dto.OtpDTOs.OtpVerifyResponse;

public interface OtpService {

    OtpRequestResponse requestOtp(OtpRequestRequest request);

    OtpVerifyResponse verifyOtp(OtpVerifyRequest request);

    void validateSessionToken(String sessionToken, String prospectPhone);

    /** Validates a verified, unexpired OTP session and returns the phone number it was issued for. */
    String resolveVerifiedPhone(String sessionToken);
}
