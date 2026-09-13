package com.livic.platform.storage.service.interfaces;

import com.livic.platform.common.enums.OwnerModule;
import com.livic.platform.storage.dto.MediaDTOs;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StorageService {

    MediaDTOs.UploadAuthorizationResponse createUploadAuthorization(MediaDTOs.UploadAuthorizationRequest request, UUID userId);

    MediaDTOs.MediaAssetDTO confirmUpload(MediaDTOs.ConfirmUploadRequest request, UUID userId);

    List<MediaDTOs.MediaAssetDTO> listAssets(OwnerModule ownerModule, UUID referenceId);

    Optional<MediaDTOs.MediaAssetDTO> getAssetById(UUID mediaAssetId);

    List<MediaDTOs.MediaAssetDTO> listAssetsForReferences(OwnerModule ownerModule, Collection<UUID> referenceIds);

    void deleteAsset(UUID mediaAssetId, UUID userId);
}

