package com.livic.platform.storage.facade.impl;

import com.livic.platform.storage.dto.FileType;
import com.livic.platform.common.enums.OwnerModule;
import com.livic.platform.storage.dto.MediaDTOs;
import com.livic.platform.storage.facade.StorageFacade;
import com.livic.platform.storage.service.interfaces.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StorageFacadeImpl implements StorageFacade {

    private final StorageService storageService;

    @Override
    public MediaDTOs.UploadAuthorizationResponse requestUploadAuthorization(
            OwnerModule ownerModule, 
            UUID referenceId, 
            FileType fileType, 
            String filename, 
            UUID userId) {
        MediaDTOs.UploadAuthorizationRequest request = new MediaDTOs.UploadAuthorizationRequest(
                ownerModule, referenceId, fileType, filename
        );
        return storageService.createUploadAuthorization(request, userId);
    }

    @Override
    public MediaDTOs.MediaAssetDTO confirmUpload(MediaDTOs.ConfirmUploadRequest request, UUID userId) {
        return storageService.confirmUpload(request, userId);
    }

    @Override
    public List<MediaDTOs.MediaAssetDTO> getAssets(OwnerModule ownerModule, UUID referenceId) {
        return storageService.listAssets(ownerModule, referenceId);
    }

    @Override
    public java.util.Optional<MediaDTOs.MediaAssetDTO> getAssetById(UUID mediaAssetId) {
        return storageService.getAssetById(mediaAssetId);
    }

    @Override
    public Map<UUID, List<MediaDTOs.MediaAssetDTO>> getAssetsForReferences(OwnerModule ownerModule, Collection<UUID> referenceIds) {
        List<MediaDTOs.MediaAssetDTO> assets = storageService.listAssetsForReferences(ownerModule, referenceIds);
        return assets.stream().collect(Collectors.groupingBy(MediaDTOs.MediaAssetDTO::referenceId));
    }

    @Override
    public void deleteAsset(UUID mediaAssetId, UUID userId) {
        storageService.deleteAsset(mediaAssetId, userId);
    }
}

