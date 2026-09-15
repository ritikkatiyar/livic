package com.livic.features.marketplace.controller;

import com.livic.features.marketplace.dto.TourAvailabilityDTOs;
import com.livic.features.marketplace.service.interfaces.TourAvailabilityService;
import com.livic.platform.common.response.ApiResponse;
import com.livic.platform.security.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Landlord / property staff: visiting hours and blocked dates for marketplace tours. */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TourAvailabilityController {

    private final TourAvailabilityService tourAvailabilityService;

    @GetMapping("/properties/{propertyId}/tour-availability")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'LEASE_VIEW')")
    public ResponseEntity<ApiResponse<TourAvailabilityDTOs.TourAvailabilityResponse>> getAvailability(@PathVariable UUID propertyId) {
        return ResponseEntity.ok(ApiResponse.success(tourAvailabilityService.getAvailability(propertyId)));
    }

    @PutMapping("/properties/{propertyId}/tour-availability")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<TourAvailabilityDTOs.TourAvailabilityResponse>> updateAvailability(
            @PathVariable UUID propertyId,
            @Valid @RequestBody TourAvailabilityDTOs.UpdateTourAvailabilityRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                tourAvailabilityService.updateAvailability(propertyId, request, callerUserId(currentUser))));
    }

    @PostMapping("/properties/{propertyId}/tour-blackouts")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<TourAvailabilityDTOs.BlackoutResponse>> addBlackout(
            @PathVariable UUID propertyId,
            @Valid @RequestBody TourAvailabilityDTOs.CreateBlackoutRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                tourAvailabilityService.addBlackout(propertyId, request, callerUserId(currentUser))));
    }

    /** Permission is checked against the blackout's property in the service. */
    @DeleteMapping("/tour-blackouts/{blackoutId}")
    public ResponseEntity<Void> deleteBlackout(@PathVariable UUID blackoutId) {
        tourAvailabilityService.deleteBlackout(blackoutId);
        return ResponseEntity.noContent().build();
    }

    private UUID callerUserId(UserDetailsImpl userDetails) {
        return userDetails != null ? UUID.fromString(userDetails.getId()) : null;
    }
}
