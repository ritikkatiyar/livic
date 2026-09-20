package com.livic.core.property.controller;

import com.livic.core.property.dto.BlockDTOs;
import com.livic.core.property.service.interfaces.BlockService;
import com.livic.platform.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * The buildings inside a property.
 *
 * <p>Clients that never call this keep working: a property always has one default block, and
 * the unit and floor endpoints fall back to it when no block is named.
 */
@RestController
@RequestMapping("/api/v1/properties/{propertyId}/blocks")
@RequiredArgsConstructor
public class BlockController {

    private final BlockService blockService;

    @GetMapping
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<List<BlockDTOs.BlockResponse>>> list(@PathVariable UUID propertyId) {
        return ResponseEntity.ok(ApiResponse.success(blockService.listBlocks(propertyId)));
    }

    @PostMapping
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<BlockDTOs.BlockResponse>> create(
            @PathVariable UUID propertyId,
            @Valid @RequestBody BlockDTOs.CreateBlockRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(blockService.create(propertyId, request)));
    }

    @PutMapping("/{blockId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<BlockDTOs.BlockResponse>> update(
            @PathVariable UUID propertyId,
            @PathVariable UUID blockId,
            @Valid @RequestBody BlockDTOs.UpdateBlockRequest request) {
        return ResponseEntity.ok(ApiResponse.success(blockService.update(propertyId, blockId, request)));
    }

    @DeleteMapping("/{blockId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID propertyId,
            @PathVariable UUID blockId) {
        blockService.delete(propertyId, blockId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
