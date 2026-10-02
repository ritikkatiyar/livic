package com.livic.core.property.controller;

import com.livic.platform.common.response.ApiResponse;
import com.livic.core.property.dto.MeDTOs;
import com.livic.core.property.service.interfaces.MeService;
import com.livic.platform.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Post-login context: global role (user), property memberships (auth) and unit memberships.
 * Lives in property because property owns units and already depends on auth and user;
 * placing it in user would recreate the auth/user cycle.
 */
@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
public class MeContextController {

    private final MeService meService;

    @GetMapping("/context")
    public ResponseEntity<ApiResponse<MeDTOs.MyContextResponse>> getContext(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(meService.getUserContext(userId)));
    }
}
