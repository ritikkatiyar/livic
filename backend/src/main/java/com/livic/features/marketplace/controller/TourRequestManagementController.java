package com.livic.features.marketplace.controller;

import com.livic.features.marketplace.dto.TourRequestDTOs;
import com.livic.features.marketplace.service.interfaces.TourRequestManagementService;
import com.livic.platform.common.response.ApiResponse;
import com.livic.platform.security.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Landlord / property staff management of marketplace tour requests. */
@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TourRequestManagementController {

    private final TourRequestManagementService tourRequestService;

    @GetMapping("/properties/{propertyId}/tour-requests")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'LEASE_VIEW')")
    public ResponseEntity<ApiResponse<Page<TourRequestDTOs.LandlordTourRequestResponse>>> listTourRequests(
            @PathVariable UUID propertyId,
            @RequestParam(defaultValue = "PENDING") TourRequestDTOs.TourRequestFilter filter,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(tourRequestService.listTourRequests(propertyId, filter, pageable)));
    }

    @GetMapping("/properties/{propertyId}/tour-requests/summary")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'LEASE_VIEW')")
    public ResponseEntity<ApiResponse<TourRequestDTOs.TourRequestSummaryResponse>> getSummary(@PathVariable UUID propertyId) {
        return ResponseEntity.ok(ApiResponse.success(tourRequestService.getSummary(propertyId)));
    }

    @PostMapping("/tour-requests/{leadId}/approve")
    public ResponseEntity<ApiResponse<TourRequestDTOs.LandlordTourRequestResponse>> approve(
            @PathVariable UUID leadId,
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        return ResponseEntity.ok(ApiResponse.success(tourRequestService.approve(leadId, callerUserId(currentUser))));
    }

    @PostMapping("/tour-requests/{leadId}/reject")
    public ResponseEntity<ApiResponse<TourRequestDTOs.LandlordTourRequestResponse>> reject(
            @PathVariable UUID leadId,
            @Valid @RequestBody(required = false) TourRequestDTOs.RejectTourRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        String note = request != null ? request.note() : null;
        return ResponseEntity.ok(ApiResponse.success(tourRequestService.reject(leadId, callerUserId(currentUser), note)));
    }

    private UUID callerUserId(UserDetailsImpl userDetails) {
        return userDetails != null ? UUID.fromString(userDetails.getId()) : null;
    }
}
