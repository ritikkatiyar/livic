package com.livic.platform.user.controller;

import com.livic.platform.common.response.ApiResponse;
import com.livic.platform.user.dto.UserDTOs;
import com.livic.platform.user.service.interfaces.UserQueryService;
import com.livic.platform.user.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserQueryService userQueryService;

    /**
     * Finds the account behind a full phone number, for a landlord adding a tenant to a property
     * they manage. People sign up themselves; nobody creates an account for someone else. Exact match only: a partial number used to return up to ten accounts, which let
     * any signed-in user list everyone's name, email and phone a few digits at a time.
     */
    @GetMapping("/search")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'LEASE_CREATE')")
    public ResponseEntity<ApiResponse<List<UserDTOs.UserSearchResponse>>> searchByPhone(
            @RequestParam String phone,
            @RequestParam UUID propertyId
    ) {
        return ResponseEntity.ok(ApiResponse.success(userQueryService.lookupByPhoneNumber(phone)));
    }
}
