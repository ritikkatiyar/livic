package com.livic.platform.storage.facade;

import com.livic.platform.storage.dto.FileType;
import com.livic.platform.common.enums.OwnerModule;
import com.livic.platform.storage.dto.MediaDTOs;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface StorageFacade {

    MediaDTOs.UploadAuthorizationResponse requestUploadAuthorization(
            OwnerModule ownerModule, 
            UUID referenceId, 
            FileType fileType, 
            String filename, 
            UUID userId);

    MediaDTOs.MediaAssetDTO confirmUpload(MediaDTOs.ConfirmUploadRequest request, UUID userId);

    List<MediaDTOs.MediaAssetDTO> getAssets(OwnerModule ownerModule, UUID referenceId);

    Optional<MediaDTOs.MediaAssetDTO> getAssetById(UUID mediaAssetId);

    Map<UUID, List<MediaDTOs.MediaAssetDTO>> getAssetsForReferences(OwnerModule ownerModule, Collection<UUID> referenceIds);

    void deleteAsset(UUID mediaAssetId, UUID userId);
}

