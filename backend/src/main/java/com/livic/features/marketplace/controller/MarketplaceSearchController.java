package com.livic.features.marketplace.controller;

import com.livic.platform.common.response.ApiResponse;
import com.livic.features.marketplace.dto.MarketplacePropertyDTOs;
import com.livic.features.marketplace.dto.MarketplaceUnitDTOs;
import com.livic.features.marketplace.service.interfaces.MarketplaceSearchService;
import com.livic.services.property.domain.PropertyType;
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
    public ResponseEntity<ApiResponse<Page<MarketplacePropertyDTOs.PropertySummaryResponse>>> searchProperties(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) PropertyType type,
            @PageableDefault(size = 12) Pageable pageable
    ) {
        Page<MarketplacePropertyDTOs.PropertySummaryResponse> page = searchService.searchProperties(city, type, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{propertyId}")
    public ResponseEntity<ApiResponse<MarketplacePropertyDTOs.PropertyDetailResponse>> getPropertyDetail(
            @PathVariable UUID propertyId
    ) {
        MarketplacePropertyDTOs.PropertyDetailResponse response = searchService.getPropertyDetail(propertyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{propertyId}/units/{unitId}")
    public ResponseEntity<ApiResponse<MarketplaceUnitDTOs.UnitDetailCompositeResponse>> getUnitDetailComposite(
            @PathVariable UUID propertyId,
            @PathVariable UUID unitId
    ) {
        MarketplaceUnitDTOs.UnitDetailCompositeResponse response = searchService.getUnitDetailComposite(propertyId, unitId);
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
