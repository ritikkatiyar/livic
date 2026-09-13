package com.livic.platform.user.controller;

import com.livic.platform.common.response.ApiResponse;
import com.livic.platform.user.dto.UserDTOs;
import com.livic.platform.user.service.interfaces.UserQueryService;
import com.livic.platform.user.service.interfaces.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserQueryService userQueryService;

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserDTOs.UserSearchResponse>>> searchByPhone(
            @RequestParam String phone
    ) {
        List<UserDTOs.UserSearchResponse> results = userQueryService.searchByPhoneNumber(phone).stream()
                .map(UserDTOs.UserSearchResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @PostMapping("/create-tenant")
    public ResponseEntity<ApiResponse<UserDTOs.UserSearchResponse>> createTenant(
            @Valid @RequestBody UserDTOs.CreateTenantRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.createTenant(request)));
    }
}
