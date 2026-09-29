package com.livic.verticals.hostel.mess.controller;

import com.livic.platform.common.response.ApiResponse;
import com.livic.platform.security.UserDetailsImpl;
import com.livic.verticals.hostel.mess.dto.MessMenuResponse;
import com.livic.verticals.hostel.mess.dto.UpdateMealSlotsRequest;
import com.livic.verticals.hostel.mess.dto.UpdateMessSettingsRequest;
import com.livic.verticals.hostel.mess.dto.UpdateWeekMenuRequest;
import com.livic.verticals.hostel.mess.service.interfaces.MessMenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** The weekly mess menu: property staff edit it, residents read the one where they live. */
@RestController
@RequestMapping("/api/v1/mess")
@RequiredArgsConstructor
public class MessMenuController {

    private final MessMenuService messMenuService;

    @GetMapping("/properties/{propertyId}/menu")
    @PreAuthorize("@authorizationService.hasAnyPermission(#propertyId, 'MESS_VIEW', 'MESS_MANAGE')")
    public ResponseEntity<ApiResponse<MessMenuResponse>> getMenu(@PathVariable UUID propertyId) {
        return ResponseEntity.ok(ApiResponse.success(messMenuService.getMenu(propertyId)));
    }

    @PutMapping("/properties/{propertyId}/settings")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MESS_MANAGE')")
    public ResponseEntity<ApiResponse<MessMenuResponse>> updateSettings(
            @PathVariable UUID propertyId,
            @Valid @RequestBody UpdateMessSettingsRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                messMenuService.updateSettings(propertyId, request, currentUser.getUuid())));
    }

    @PutMapping("/properties/{propertyId}/slots")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MESS_MANAGE')")
    public ResponseEntity<ApiResponse<MessMenuResponse>> updateSlots(
            @PathVariable UUID propertyId,
            @Valid @RequestBody UpdateMealSlotsRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                messMenuService.updateSlots(propertyId, request, currentUser.getUuid())));
    }

    @PutMapping("/properties/{propertyId}/week")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MESS_MANAGE')")
    public ResponseEntity<ApiResponse<MessMenuResponse>> updateWeek(
            @PathVariable UUID propertyId,
            @Valid @RequestBody UpdateWeekMenuRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                messMenuService.updateWeek(propertyId, request, currentUser.getUuid())));
    }

    // Any signed-in user: the service answers only from the caller's own homes
    @GetMapping("/my-menu")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MessMenuResponse>> getMyMenu(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(ApiResponse.success(messMenuService.getMyMenu(currentUser.getUuid())));
    }
}
