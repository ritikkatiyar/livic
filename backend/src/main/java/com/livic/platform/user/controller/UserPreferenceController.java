package com.livic.platform.user.controller;

import com.livic.platform.common.response.ApiResponse;
import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.user.dto.UserPreferenceResponse;
import com.livic.platform.user.dto.SaveUserPreferenceRequest;
import com.livic.platform.user.service.interfaces.UserPreferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/user/preference")
@RequiredArgsConstructor
public class UserPreferenceController {

    private final UserPreferenceService service;

    @PostMapping
    public ApiResponse<UserPreferenceResponse> savePreference(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody SaveUserPreferenceRequest request
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        UserPreferenceResponse response = service.savePreference(userId, request);
        return ApiResponse.success(response);
    }

    @GetMapping
    public ApiResponse<UserPreferenceResponse> getPreference(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        UserPreferenceResponse response = service.getPreference(userId);
        return ApiResponse.success(response);
    }
}
