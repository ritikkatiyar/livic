package com.livic.features.marketplace.controller;

import com.livic.platform.common.response.ApiResponse;
import com.livic.features.marketplace.dto.OtpDTOs;
import com.livic.features.marketplace.service.interfaces.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/marketplace/otp")
@RequiredArgsConstructor
public class MarketplaceOtpController {

    private final OtpService otpService;

    @PostMapping("/request")
    public ResponseEntity<ApiResponse<OtpDTOs.OtpRequestResponse>> requestOtp(
            @Valid @RequestBody OtpDTOs.OtpRequestRequest request
    ) {
        OtpDTOs.OtpRequestResponse response = otpService.requestOtp(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<OtpDTOs.OtpVerifyResponse>> verifyOtp(
            @Valid @RequestBody OtpDTOs.OtpVerifyRequest request
    ) {
        OtpDTOs.OtpVerifyResponse response = otpService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
