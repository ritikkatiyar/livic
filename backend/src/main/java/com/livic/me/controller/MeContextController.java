package com.livic.me.controller;

import com.livic.common.response.ApiResponse;
import com.livic.me.dto.MeDTOs;
import com.livic.me.service.interfaces.MeService;
import com.livic.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Composition endpoint: combines user, memberships (auth) and active lease (finance).
 * Lives outside those modules so none of them has to depend on the others.
 */
@RestController
@RequestMapping({"/api/v1/user", "/api/v1"})
@RequiredArgsConstructor
public class MeContextController {

    private final MeService meService;

    @GetMapping("/me/context")
    public ResponseEntity<ApiResponse<MeDTOs.MyContextResponse>> getContext(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(meService.getUserContext(userId)));
    }
}
