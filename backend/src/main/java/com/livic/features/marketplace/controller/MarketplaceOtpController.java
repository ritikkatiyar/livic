package com.livic.features.marketplace.controller;

import com.livic.features.marketplace.dto.OtpDTOs.OtpRequestRequest;
import com.livic.features.marketplace.dto.OtpDTOs.OtpRequestResponse;
import com.livic.features.marketplace.dto.OtpDTOs.OtpVerifyRequest;
import com.livic.features.marketplace.dto.OtpDTOs.OtpVerifyResponse;
import com.livic.features.marketplace.service.interfaces.OtpService;
import com.livic.platform.common.response.ApiResponse;
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
    public ResponseEntity<ApiResponse<OtpRequestResponse>> requestOtp(
            @Valid @RequestBody OtpRequestRequest request
    ) {
        OtpRequestResponse response = otpService.requestOtp(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<OtpVerifyResponse>> verifyOtp(
            @Valid @RequestBody OtpVerifyRequest request
    ) {
        OtpVerifyResponse response = otpService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
