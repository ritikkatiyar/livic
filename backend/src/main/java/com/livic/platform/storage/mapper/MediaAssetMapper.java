package com.livic.platform.storage.mapper;

import com.livic.platform.storage.domain.MediaAssetTbl;
import com.livic.platform.storage.dto.MediaDTOs.MediaAssetDTO;

import java.util.List;
import java.util.stream.Collectors;

public final class MediaAssetMapper {

    private MediaAssetMapper() {
    }

    public static MediaAssetDTO toResponse(MediaAssetTbl entity) {
        return new MediaAssetDTO(
                entity.getId(),
                entity.getOwnerModule(),
                entity.getReferenceId(),
                entity.getStorageProvider(),
                entity.getExternalId(),
                entity.getUrl(),
                entity.getFileType(),
                entity.getCaption(),
                entity.getUploadedByUserId(),
                entity.getUploadedAt()
        );
    }

    public static List<MediaAssetDTO> toResponseList(List<MediaAssetTbl> entities) {
        return entities.stream()
                .map(MediaAssetMapper::toResponse)
                .collect(Collectors.toList());
    }
}
