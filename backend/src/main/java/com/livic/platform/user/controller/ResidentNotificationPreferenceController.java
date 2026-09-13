package com.livic.platform.user.controller;

import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.common.response.ApiResponse;
import com.livic.platform.user.dto.UserNotificationPreferencesDTO;
import com.livic.platform.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/user/notification-preferences")
@RequiredArgsConstructor
public class ResidentNotificationPreferenceController {

    private final UserFacade userFacade;

    @GetMapping
    public ResponseEntity<ApiResponse<UserNotificationPreferencesDTO>> getPreferences(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(userFacade.getNotificationPreferences(userId)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserNotificationPreferencesDTO>> updatePreferences(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody UserNotificationPreferencesDTO request
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(userFacade.updateNotificationPreferences(userId, request)));
    }
}
