package com.livic.platform.storage.facade;

import com.livic.platform.auth.spi.ResourceType;
import com.livic.platform.storage.dto.MediaDTOs;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface StorageFacade {

    List<MediaDTOs.MediaAssetDTO> getAssets(ResourceType owner, UUID referenceId);

    Optional<MediaDTOs.MediaAssetDTO> getAssetById(UUID mediaAssetId);

    Map<UUID, List<MediaDTOs.MediaAssetDTO>> getAssetsForReferences(ResourceType owner, Collection<UUID> referenceIds);
}

