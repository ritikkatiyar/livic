package com.livic.features.marketplace.controller;

import com.livic.features.marketplace.dto.MarketplacePropertyDTOs.PropertyDetailResponse;
import com.livic.features.marketplace.dto.MarketplacePropertyDTOs.PropertySummaryResponse;
import com.livic.features.marketplace.dto.MarketplaceUnitDTOs.UnitDetailCompositeResponse;
import com.livic.features.marketplace.dto.MarketplaceUnitDTOs.UnitSummaryResponse;
import com.livic.features.marketplace.service.interfaces.MarketplaceSearchService;
import com.livic.platform.common.domain.PropertyType;
import com.livic.platform.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/marketplace/properties")
@RequiredArgsConstructor
public class MarketplaceSearchController {

    private final MarketplaceSearchService searchService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PropertySummaryResponse>>> searchProperties(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) PropertyType type,
            @PageableDefault(size = 12) Pageable pageable
    ) {
        Page<PropertySummaryResponse> page = searchService.searchProperties(city, type, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{propertyId}")
    public ResponseEntity<ApiResponse<PropertyDetailResponse>> getPropertyDetail(
            @PathVariable UUID propertyId
    ) {
        PropertyDetailResponse response = searchService.getPropertyDetail(propertyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{propertyId}/units")
    public ResponseEntity<ApiResponse<Page<UnitSummaryResponse>>> getPropertyUnits(
            @PathVariable UUID propertyId,
            @RequestParam(defaultValue = "false") boolean availableOnly,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        Page<UnitSummaryResponse> page = searchService.getPropertyUnits(propertyId, availableOnly, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{propertyId}/units/{unitId}")
    public ResponseEntity<ApiResponse<UnitDetailCompositeResponse>> getUnitDetailComposite(
            @PathVariable UUID propertyId,
            @PathVariable UUID unitId
    ) {
        UnitDetailCompositeResponse response = searchService.getUnitDetailComposite(propertyId, unitId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{propertyId}/qr")
    public ResponseEntity<byte[]> getPropertyQrCode(@PathVariable UUID propertyId) {
        byte[] qrImagePng = searchService.getPropertyQrCode(propertyId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        headers.setCacheControl("public, max-age=86400");
        return new ResponseEntity<>(qrImagePng, headers, HttpStatus.OK);
    }
}
