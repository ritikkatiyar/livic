package com.livic.property.controller;

import com.livic.security.UserDetailsImpl;
import com.livic.common.response.ApiResponse;
import com.livic.property.dto.PropertyJoinCodeDTOs;
import com.livic.property.service.interfaces.PropertyJoinCodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
public class PropertyJoinCodeController {

    private final PropertyJoinCodeService propertyJoinCodeService;

    @PostMapping("/{propertyId}/join-codes")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MANAGE_STAFF')")
    public ResponseEntity<ApiResponse<PropertyJoinCodeDTOs.JoinCodeResponse>> generateJoinCode(
            @PathVariable UUID propertyId,
            @Valid @RequestBody PropertyJoinCodeDTOs.GenerateJoinCodeRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID actorId = UUID.fromString(currentUser.getId());
        PropertyJoinCodeDTOs.JoinCodeResponse created = propertyJoinCodeService.generateJoinCode(
                propertyId, 
                request.title(),
                request.accessType(),
                request.permissionCodes(),
                request.maxUses(), 
                actorId
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    @GetMapping("/{propertyId}/join-codes")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MANAGE_STAFF')")
    public ResponseEntity<ApiResponse<Page<PropertyJoinCodeDTOs.JoinCodeResponse>>> getPropertyJoinCodes(
            @PathVariable UUID propertyId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<PropertyJoinCodeDTOs.JoinCodeResponse> responses = propertyJoinCodeService.getPropertyJoinCodes(propertyId, pageable);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/join-codes/validate")
    public ResponseEntity<ApiResponse<PropertyJoinCodeDTOs.JoinCodeResultResponse>> validateAndApplyJoinCode(
            @Valid @RequestBody PropertyJoinCodeDTOs.ValidateJoinCodeRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(
                propertyJoinCodeService.validateAndApplyJoinCode(request.code(), userId)
        ));
    }
}
