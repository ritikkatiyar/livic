package com.livic.platform.user.controller;

import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.common.response.ApiResponse;
import com.livic.platform.user.dto.UserDTOs;
import com.livic.platform.user.service.interfaces.UserQueryService;
import com.livic.platform.user.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/user", "/api/v1"})
@RequiredArgsConstructor
public class MeController {

    private final UserQueryService userQueryService;
    private final UserService userService;
    private final com.livic.platform.user.facade.UserFacade userFacade;

    @GetMapping("/tenant/profile")
    public ResponseEntity<ApiResponse<UserDTOs.TenantProfileResponse>> getTenantProfile(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(
                UserDTOs.TenantProfileResponse.from(userQueryService.getUserById(userId))
        ));
    }

    @PutMapping("/tenant/profile")
    public ResponseEntity<ApiResponse<UserDTOs.TenantProfileResponse>> updateTenantProfile(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody UserDTOs.UpdateTenantProfileRequest request
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(
                userService.updateTenantProfile(userQueryService.getUserById(userId), request)
        ));
    }

    @PostMapping("/me/device-token")
    public ResponseEntity<ApiResponse<Void>> registerDeviceToken(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @jakarta.validation.Valid @RequestBody UserDTOs.RegisterDeviceTokenRequest request
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        userFacade.registerDeviceToken(userId, request.expoPushToken(), request.platform());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
