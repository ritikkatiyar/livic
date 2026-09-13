package com.livic.platform.storage.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.storage.config.StorageProperties;
import com.livic.platform.storage.domain.MediaAssetTbl;
import com.livic.platform.storage.dto.FileType;
import com.livic.platform.common.enums.OwnerModule;
import com.livic.platform.storage.mapper.MediaAssetMapper;
import com.livic.platform.storage.dto.StorageProvider;
import com.livic.platform.storage.dto.MediaDTOs;
import com.livic.platform.storage.repository.MediaAssetRepository;
import com.livic.platform.storage.service.interfaces.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryStorageServiceImpl implements StorageService {

    private final StorageProperties properties;
    private final MediaAssetRepository mediaAssetRepository;

    @Override
    public MediaDTOs.UploadAuthorizationResponse createUploadAuthorization(
            MediaDTOs.UploadAuthorizationRequest request, 
            UUID userId) {
        
        long timestamp = Instant.now().getEpochSecond();
        String folder = String.format("%s/%s/%s",
                properties.getFolderPrefix(),
                request.ownerModule().name().toLowerCase(),
                request.referenceId().toString());

        String publicId = String.format("%s_%s",
                request.fileType().name().toLowerCase(),
                UUID.randomUUID().toString().substring(0, 8));

        Map<String, Object> paramsToSign = new HashMap<>();
        paramsToSign.put("timestamp", timestamp);
        paramsToSign.put("folder", folder);
        paramsToSign.put("public_id", publicId);

        Cloudinary cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", properties.getCloudName(),
                "api_key", properties.getApiKey(),
                "api_secret", properties.getApiSecret()
        ));

        String signature = cloudinary.apiSignRequest(paramsToSign, properties.getApiSecret());
        String resourceType = request.fileType() == FileType.IMAGE ? "image" : "raw";
        String uploadUrl = String.format("https://api.cloudinary.com/v1_1/%s/%s/upload",
                properties.getCloudName(),
                resourceType);

        log.info("[STORAGE] Generated Cloudinary upload signature for ownerModule={}, refId={}, user={}",
                request.ownerModule(), request.referenceId(), userId);

        return new MediaDTOs.UploadAuthorizationResponse(
                uploadUrl,
                properties.getApiKey(),
                timestamp,
                signature,
                folder,
                publicId,
                StorageProvider.CLOUDINARY,
                paramsToSign
        );
    }

    @Override
    @Transactional
    public MediaDTOs.MediaAssetDTO confirmUpload(MediaDTOs.ConfirmUploadRequest request, UUID userId) {
        MediaAssetTbl asset = MediaAssetTbl.builder()
                .id(UUID.randomUUID())
                .ownerModule(request.ownerModule())
                .referenceId(request.referenceId())
                .storageProvider(StorageProvider.CLOUDINARY)
                .externalId(request.externalId())
                .url(request.url())
                .fileType(request.fileType())
                .caption(request.caption())
                .uploadedByUserId(userId)
                .uploadedAt(Instant.now())
                .build();

        MediaAssetTbl saved = mediaAssetRepository.save(asset);
        log.info("[STORAGE] Confirmed media asset id={}, ownerModule={}, refId={}, user={}",
                saved.getId(), saved.getOwnerModule(), saved.getReferenceId(), userId);

        return MediaAssetMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<MediaDTOs.MediaAssetDTO> getAssetById(UUID mediaAssetId) {
        return mediaAssetRepository.findById(mediaAssetId)
                .map(MediaAssetMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MediaDTOs.MediaAssetDTO> listAssets(OwnerModule ownerModule, UUID referenceId) {
        return mediaAssetRepository.findAllByOwnerModuleAndReferenceId(ownerModule, referenceId)
                .stream()
                .map(MediaAssetMapper::toResponse)
                .collect(Collectors.toList());
    }


    @Override
    @Transactional(readOnly = true)
    public List<MediaDTOs.MediaAssetDTO> listAssetsForReferences(OwnerModule ownerModule, Collection<UUID> referenceIds) {
        if (referenceIds == null || referenceIds.isEmpty()) {
            return List.of();
        }
        return mediaAssetRepository.findAllByOwnerModuleAndReferenceIdIn(ownerModule, referenceIds)
                .stream()
                .map(MediaAssetMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteAsset(UUID mediaAssetId, UUID userId) {
        MediaAssetTbl asset = mediaAssetRepository.findById(mediaAssetId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Media asset not found with ID: " + mediaAssetId));

        try {
            Cloudinary cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", properties.getCloudName(),
                    "api_key", properties.getApiKey(),
                    "api_secret", properties.getApiSecret()
            ));

            String resourceType = asset.getFileType() == FileType.IMAGE ? "image" : "raw";
            Map result = cloudinary.uploader().destroy(asset.getExternalId(), ObjectUtils.asMap(
                    "resource_type", resourceType,
                    "invalidate", true
            ));
            log.info("[STORAGE] Cloudinary destroy result for externalId={}: {}", asset.getExternalId(), result);
        } catch (Exception e) {
            log.warn("[STORAGE] Failed to destroy asset on Cloudinary (externalId={}): {}", asset.getExternalId(), e.getMessage());
        }

        mediaAssetRepository.delete(asset);
        log.info("[STORAGE] Deleted media asset id={}, user={}", mediaAssetId, userId);
    }


}
