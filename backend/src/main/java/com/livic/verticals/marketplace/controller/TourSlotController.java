package com.livic.verticals.marketplace.controller;

import com.livic.verticals.marketplace.dto.TourAvailabilityDTOs.TourSlotsResponse;
import com.livic.verticals.marketplace.service.interfaces.TourAvailabilityService;
import com.livic.platform.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Public: the visit slots a prospect can pick for a listed property. */
@RestController
@RequestMapping("/api/v1/marketplace")
@RequiredArgsConstructor
public class TourSlotController {

    private final TourAvailabilityService tourAvailabilityService;

    @GetMapping("/properties/{propertyId}/tour-slots")
    public ResponseEntity<ApiResponse<TourSlotsResponse>> getTourSlots(
            @PathVariable UUID propertyId,
            @RequestHeader(name = "X-Otp-Session-Token", required = false) String sessionToken
    ) {
        return ResponseEntity.ok(ApiResponse.success(tourAvailabilityService.getTourSlots(propertyId, sessionToken)));
    }
}
