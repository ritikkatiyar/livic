package com.livic.features.marketplace.controller;

import com.livic.features.marketplace.dto.TourRequestDTOs;
import com.livic.features.marketplace.service.interfaces.MyTourRequestService;
import com.livic.platform.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Public "My Requests" endpoints for prospects without an account; identity is the OTP-verified phone session. */
@RestController
@RequestMapping("/api/v1/marketplace/my/tour-requests")
@RequiredArgsConstructor
public class MyTourRequestController {

    private final MyTourRequestService myTourRequestService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TourRequestDTOs.MyTourRequestResponse>>> listMyTourRequests(
            @RequestHeader(name = "X-Otp-Session-Token", required = false) String sessionToken,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(myTourRequestService.listMyTourRequests(sessionToken, pageable)));
    }

    @GetMapping("/declined-slots")
    public ResponseEntity<ApiResponse<TourRequestDTOs.DeclinedTourSlotsResponse>> listDeclinedSlots(
            @RequestParam UUID propertyId,
            @RequestHeader(name = "X-Otp-Session-Token", required = false) String sessionToken
    ) {
        return ResponseEntity.ok(ApiResponse.success(myTourRequestService.listDeclinedSlots(sessionToken, propertyId)));
    }

    @PostMapping("/{leadId}/cancel")
    public ResponseEntity<ApiResponse<TourRequestDTOs.MyTourRequestResponse>> cancelMyTourRequest(
            @PathVariable UUID leadId,
            @RequestHeader(name = "X-Otp-Session-Token", required = false) String sessionToken
    ) {
        return ResponseEntity.ok(ApiResponse.success(myTourRequestService.cancelMyTourRequest(sessionToken, leadId)));
    }
}
