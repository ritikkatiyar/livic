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
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
public class MeController {

    private final UserQueryService userQueryService;
    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserDTOs.ProfileResponse>> getProfile(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(
                userQueryService.getProfile(userId)
        ));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserDTOs.ProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody UserDTOs.UpdateProfileRequest request
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(
                userService.updateProfile(userId, request)
        ));
    }

    @PostMapping("/device-token")
    public ResponseEntity<ApiResponse<Void>> registerDeviceToken(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @jakarta.validation.Valid @RequestBody UserDTOs.RegisterDeviceTokenRequest request
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        userService.registerDeviceToken(userId, request.expoPushToken(), request.platform());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
