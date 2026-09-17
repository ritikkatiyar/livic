package com.livic.verticals.marketplace.service.interfaces;

import com.livic.verticals.marketplace.dto.OtpDTOs.OtpRequestRequest;
import com.livic.verticals.marketplace.dto.OtpDTOs.OtpRequestResponse;
import com.livic.verticals.marketplace.dto.OtpDTOs.OtpVerifyRequest;
import com.livic.verticals.marketplace.dto.OtpDTOs.OtpVerifyResponse;

public interface OtpService {

    /**
     * Creates a code and sends it by SMS.
     *
     * @param clientIp the caller's address, for the per-IP request limit
     */
    OtpRequestResponse requestOtp(OtpRequestRequest request, String clientIp);

    OtpVerifyResponse verifyOtp(OtpVerifyRequest request);

    void validateSessionToken(String sessionToken, String prospectPhone);

    /** Validates a verified, unexpired OTP session and returns the phone number it was issued for. */
    String resolveVerifiedPhone(String sessionToken);

    /** Deletes verification rows old enough that neither their code nor their session can still be used. */
    int deleteStaleVerifications();
}
