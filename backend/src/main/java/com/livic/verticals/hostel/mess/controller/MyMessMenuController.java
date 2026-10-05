package com.livic.verticals.hostel.mess.controller;

import com.livic.platform.common.response.ApiResponse;
import com.livic.platform.security.UserDetailsImpl;
import com.livic.verticals.hostel.mess.dto.MessMenuResponse;
import com.livic.verticals.hostel.mess.service.interfaces.MessMenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The mess menu where the current user lives. */
@RestController
@RequestMapping("/api/v1/me/mess-menu")
@RequiredArgsConstructor
public class MyMessMenuController {

    private final MessMenuService messMenuService;

    // Any signed-in user: the service answers only from the caller's own homes
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MessMenuResponse>> getMyMessMenu(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(ApiResponse.success(messMenuService.getMyMenu(currentUser.getUuid())));
    }
}
