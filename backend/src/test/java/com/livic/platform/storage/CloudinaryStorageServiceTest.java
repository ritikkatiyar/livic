package com.livic.platform.storage;

import com.livic.platform.storage.config.StorageProperties;
import com.livic.platform.storage.domain.MediaAssetTbl;
import com.livic.platform.storage.dto.FileType;
import com.livic.platform.common.enums.OwnerModule;
import com.livic.platform.storage.dto.StorageProvider;
import com.livic.platform.storage.dto.MediaDTOs;
import com.livic.platform.storage.repository.MediaAssetRepository;
import com.livic.platform.storage.service.impl.CloudinaryStorageServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CloudinaryStorageServiceTest {

    @Mock
    private StorageProperties properties;

    @Mock
    private MediaAssetRepository mediaAssetRepository;

    @InjectMocks
    private CloudinaryStorageServiceImpl storageService;

    private UUID userId;
    private UUID referenceId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        referenceId = UUID.randomUUID();
    }

    @Test
    @DisplayName("createUploadAuthorization generates signed upload parameters")
    void testCreateUploadAuthorization() {
        when(properties.getCloudName()).thenReturn("demo-cloud");
        when(properties.getApiKey()).thenReturn("demo-key");
        when(properties.getApiSecret()).thenReturn("demo-secret");
        when(properties.getFolderPrefix()).thenReturn("livic");

        MediaDTOs.UploadAuthorizationRequest request = new MediaDTOs.UploadAuthorizationRequest(
                OwnerModule.INVENTORY,
                referenceId,
                FileType.IMAGE,
                "fridge.jpg"
        );

        MediaDTOs.UploadAuthorizationResponse response = storageService.createUploadAuthorization(request, userId);

        assertThat(response).isNotNull();
        assertThat(response.uploadUrl()).contains("demo-cloud/image/upload");
        assertThat(response.apiKey()).isEqualTo("demo-key");
        assertThat(response.signature()).isNotBlank();
        assertThat(response.folder()).isEqualTo("livic/inventory/" + referenceId);
        assertThat(response.storageProvider()).isEqualTo(StorageProvider.CLOUDINARY);
    }

    @Test
    @DisplayName("confirmUpload saves media asset and returns DTO")
    void testConfirmUpload() {
        MediaDTOs.ConfirmUploadRequest request = new MediaDTOs.ConfirmUploadRequest(
                OwnerModule.INVENTORY,
                referenceId,
                "inventory_item_123",
                "https://res.cloudinary.com/demo/image/upload/v1/inventory_item_123.jpg",
                FileType.IMAGE,
                "move-in"
        );

        when(mediaAssetRepository.save(any(MediaAssetTbl.class))).thenAnswer(inv -> inv.getArgument(0));

        MediaDTOs.MediaAssetDTO result = storageService.confirmUpload(request, userId);

        assertThat(result).isNotNull();
        assertThat(result.ownerModule()).isEqualTo(OwnerModule.INVENTORY);
        assertThat(result.referenceId()).isEqualTo(referenceId);
        assertThat(result.externalId()).isEqualTo("inventory_item_123");
        assertThat(result.url()).isEqualTo("https://res.cloudinary.com/demo/image/upload/v1/inventory_item_123.jpg");
        assertThat(result.caption()).isEqualTo("move-in");
        assertThat(result.uploadedByUserId()).isEqualTo(userId);

        ArgumentCaptor<MediaAssetTbl> captor = ArgumentCaptor.forClass(MediaAssetTbl.class);
        verify(mediaAssetRepository).save(captor.capture());
        assertThat(captor.getValue().getStorageProvider()).isEqualTo(StorageProvider.CLOUDINARY);
    }

    @Test
    @DisplayName("listAssets returns assets for owner module and reference")
    void testListAssets() {
        MediaAssetTbl asset = MediaAssetTbl.builder()
                .id(UUID.randomUUID())
                .ownerModule(OwnerModule.INVENTORY)
                .referenceId(referenceId)
                .storageProvider(StorageProvider.CLOUDINARY)
                .externalId("ext1")
                .url("https://url.com/ext1")
                .fileType(FileType.IMAGE)
                .caption("move-in")
                .uploadedByUserId(userId)
                .uploadedAt(java.time.Instant.now())
                .build();

        when(mediaAssetRepository.findAllByOwnerModuleAndReferenceId(OwnerModule.INVENTORY, referenceId))
                .thenReturn(List.of(asset));

        List<MediaDTOs.MediaAssetDTO> list = storageService.listAssets(OwnerModule.INVENTORY, referenceId);

        assertThat(list).hasSize(1);
        assertThat(list.get(0).externalId()).isEqualTo("ext1");
    }

    @Test
    @DisplayName("getAssetById returns asset DTO when found")
    void testGetAssetById_WhenFound() {
        UUID assetId = UUID.randomUUID();
        MediaAssetTbl asset = MediaAssetTbl.builder()
                .id(assetId)
                .ownerModule(OwnerModule.PROPERTY)
                .referenceId(referenceId)
                .storageProvider(StorageProvider.CLOUDINARY)
                .externalId("ext2")
                .url("https://url.com/ext2")
                .fileType(FileType.IMAGE)
                .caption("building")
                .uploadedByUserId(userId)
                .uploadedAt(java.time.Instant.now())
                .build();

        when(mediaAssetRepository.findById(assetId)).thenReturn(java.util.Optional.of(asset));

        java.util.Optional<MediaDTOs.MediaAssetDTO> opt = storageService.getAssetById(assetId);

        assertThat(opt).isPresent();
        assertThat(opt.get().id()).isEqualTo(assetId);
        assertThat(opt.get().externalId()).isEqualTo("ext2");
    }

    @Test
    @DisplayName("getAssetById returns empty optional when not found")
    void testGetAssetById_WhenNotFound() {
        UUID assetId = UUID.randomUUID();
        when(mediaAssetRepository.findById(assetId)).thenReturn(java.util.Optional.empty());

        java.util.Optional<MediaDTOs.MediaAssetDTO> opt = storageService.getAssetById(assetId);

        assertThat(opt).isEmpty();
    }
}

