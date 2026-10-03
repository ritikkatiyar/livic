package com.livic.platform.storage.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;


public final class MediaDTOs {

    private MediaDTOs() {}

    public record UploadAuthorizationRequest(
            @NotBlank(message = "Owner module is required")
            String ownerModule,

            @NotNull(message = "Reference ID is required")
            UUID referenceId,

            @NotNull(message = "File type is required")
            FileType fileType,

            String filename
    ) {}

    public record UploadAuthorizationResponse(
            String uploadUrl,
            String apiKey,
            long timestamp,
            String signature,
            String folder,
            String publicId,
            StorageProvider storageProvider,
            Map<String, Object> additionalParams
    ) {}

    public record ConfirmUploadRequest(
            @NotBlank(message = "Owner module is required")
            String ownerModule,

            @NotNull(message = "Reference ID is required")
            UUID referenceId,

            @NotBlank(message = "External ID (e.g. public_id) is required")
            String externalId,

            @NotBlank(message = "Media URL is required")
            String url,

            @NotNull(message = "File type is required")
            FileType fileType,

            String caption
    ) {}

    public record MediaAssetDTO(
            UUID id,
            String ownerModule,
            UUID referenceId,
            StorageProvider storageProvider,
            String externalId,
            String url,
            FileType fileType,
            String caption,
            UUID uploadedByUserId,
            Instant uploadedAt
    ) {}
}
