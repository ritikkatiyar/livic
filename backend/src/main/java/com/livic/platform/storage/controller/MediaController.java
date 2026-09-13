package com.livic.platform.storage.controller;

import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.common.response.ApiResponse;
import com.livic.platform.common.enums.OwnerModule;
import com.livic.platform.storage.dto.MediaDTOs;
import com.livic.platform.storage.facade.StorageFacade;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class MediaController {

    private final StorageFacade storageFacade;

    @PostMapping("/upload-authorization")
    @PreAuthorize("@authorizationService.hasMediaAccess(#request.ownerModule(), #request.referenceId(), 'WRITE')")
    public ResponseEntity<ApiResponse<MediaDTOs.UploadAuthorizationResponse>> requestUploadAuthorization(
            @Valid @RequestBody MediaDTOs.UploadAuthorizationRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        MediaDTOs.UploadAuthorizationResponse response = storageFacade.requestUploadAuthorization(
                request.ownerModule(),
                request.referenceId(),
                request.fileType(),
                request.filename(),
                userId
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/confirm")
    @PreAuthorize("@authorizationService.hasMediaAccess(#request.ownerModule(), #request.referenceId(), 'WRITE')")
    public ResponseEntity<ApiResponse<MediaDTOs.MediaAssetDTO>> confirmUpload(
            @Valid @RequestBody MediaDTOs.ConfirmUploadRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        MediaDTOs.MediaAssetDTO response = storageFacade.confirmUpload(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("@authorizationService.hasMediaAccess(#ownerModule, #referenceId, 'READ')")
    public ResponseEntity<ApiResponse<List<MediaDTOs.MediaAssetDTO>>> listMediaAssets(
            @RequestParam OwnerModule ownerModule,
            @RequestParam UUID referenceId) {
        List<MediaDTOs.MediaAssetDTO> assets = storageFacade.getAssets(ownerModule, referenceId);
        return ResponseEntity.ok(ApiResponse.success(assets));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@authorizationService.hasMediaAssetAccess(#id, 'DELETE')")
    public ResponseEntity<ApiResponse<Void>> deleteMediaAsset(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        storageFacade.deleteAsset(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}

