package com.livic.services.finance.controller;

import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.common.enums.ResourceType;
import com.livic.platform.common.response.ApiResponse;
import com.livic.services.finance.dto.ChargeConfigRequest;
import com.livic.services.finance.dto.ChargeConfigResponse;
import com.livic.services.finance.service.ChargeConfigQueryService;
import com.livic.services.finance.service.ChargeConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/charge-configs")
@RequiredArgsConstructor
public class ChargeConfigController {

    private final ChargeConfigService chargeConfigService;
    private final ChargeConfigQueryService chargeConfigQueryService;

    @PostMapping
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<ChargeConfigResponse>> createChargeConfig(@RequestBody ChargeConfigRequest request) {
        ChargeConfigResponse response = chargeConfigService.createChargeConfig(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).CHARGE_CONFIG, #id, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<ChargeConfigResponse>> updateChargeConfig(@PathVariable UUID id, @RequestBody ChargeConfigRequest request) {
        ChargeConfigResponse response = chargeConfigService.updateChargeConfig(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).CHARGE_CONFIG, #id, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deactivateChargeConfig(@PathVariable UUID id) {
        chargeConfigService.deactivateChargeConfig(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{id}/reactivate")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).CHARGE_CONFIG, #id, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<Void>> reactivateChargeConfig(@PathVariable UUID id) {
        chargeConfigService.reactivateChargeConfig(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{id}/permanent")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).CHARGE_CONFIG, #id, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteChargeConfigPermanently(@PathVariable UUID id) {
        chargeConfigService.deleteChargeConfigPermanently(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/property/{propertyId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<Page<ChargeConfigResponse>>> getChargesForProperty(
            @PathVariable UUID propertyId,
            @RequestParam(required = false, defaultValue = "false") boolean includeInactive,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        UUID userId = userDetails != null ? UUID.fromString(userDetails.getId()) : null;
        Page<ChargeConfigResponse> responses = chargeConfigQueryService.getChargesForProperty(propertyId, includeInactive, userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).CHARGE_CONFIG, #id, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<ChargeConfigResponse>> getChargeConfigById(@PathVariable UUID id) {
        ChargeConfigResponse response = chargeConfigQueryService.getChargeConfigById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
