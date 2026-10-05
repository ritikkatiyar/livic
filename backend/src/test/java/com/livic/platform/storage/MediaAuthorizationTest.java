package com.livic.platform.storage;

import com.livic.platform.auth.repository.MembershipRepository;
import com.livic.platform.auth.AuthorizationTestSupport;
import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.auth.service.impl.AuthorizationServiceImpl;
import com.livic.platform.common.domain.UserRole;
import com.livic.verticals.rental.lease.dto.LeaseSummaryDTO;
import com.livic.verticals.rental.lease.facade.LeaseFacade;
import com.livic.verticals.rental.inventory.facade.InventoryFacade;
import com.livic.platform.storage.controller.MediaController;
import com.livic.platform.storage.dto.FileType;
import com.livic.platform.storage.dto.MediaDTOs;
import com.livic.platform.storage.dto.StorageProvider;
import com.livic.platform.storage.security.MediaAuthorization;
import com.livic.platform.storage.service.interfaces.StorageService;
import com.livic.platform.user.dto.UserSummaryDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Method;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MediaAuthorizationTest {

    @Mock
    private MembershipRepository membershipRepository;

    @Mock
    private LeaseFacade leaseFacade;

    @Mock
    private InventoryFacade inventoryFacade;

    @Mock
    private StorageService storageService;

    private AuthorizationServiceImpl authorizationService;
    private MediaAuthorization mediaAuthorization;

    private UUID propertyId;
    private UUID leaseId;
    private UUID itemId;
    private UUID mediaAssetId;
    private UUID ownerUserId;
    private UUID tenantUserId;
    private UUID strangerUserId;

    @BeforeEach
    void setUp() {
        authorizationService = AuthorizationTestSupport.authorizationService(membershipRepository, null, null, null, leaseFacade, inventoryFacade);
        mediaAuthorization = new MediaAuthorization(authorizationService, storageService);
        propertyId = UUID.randomUUID();
        leaseId = UUID.randomUUID();
        itemId = UUID.randomUUID();
        mediaAssetId = UUID.randomUUID();
        ownerUserId = UUID.randomUUID();
        tenantUserId = UUID.randomUUID();
        strangerUserId = UUID.randomUUID();
    }

    private void authenticateUser(UUID userId, String email, UserRole role) {
        UserSummaryDTO userSummary = new UserSummaryDTO(
                userId,
                email,
                "Test User",
                "+919876543210",
                role
        );
        UserDetailsImpl userDetails = UserDetailsImpl.fromClaims(userSummary.id().toString(), userSummary.authUid(), userSummary.globalRole().name());
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Owner with PROPERTY_EDIT can read and write property media")
    void ownerCanReadAndWritePropertyMedia() {
        authenticateUser(ownerUserId, "owner@example.com", UserRole.USER);

        when(membershipRepository.findPermissionCodesByUserIdAndPropertyId(ownerUserId, propertyId))
                .thenReturn(Set.of("PROPERTY_EDIT", "PROPERTY_VIEW"));

        assertThat(mediaAuthorization.canAccess("PROPERTY", propertyId, "READ")).isTrue();
        assertThat(mediaAuthorization.canAccess("PROPERTY", propertyId, "WRITE")).isTrue();
    }

    @Test
    @DisplayName("Staff with only PROPERTY_VIEW can read but cannot write property media")
    void staffWithOnlyViewCanReadButNotWritePropertyMedia() {
        authenticateUser(ownerUserId, "staff@example.com", UserRole.USER);

        when(membershipRepository.findPermissionCodesByUserIdAndPropertyId(ownerUserId, propertyId))
                .thenReturn(Set.of("PROPERTY_VIEW"));

        assertThat(mediaAuthorization.canAccess("PROPERTY", propertyId, "READ")).isTrue();
        assertThat(mediaAuthorization.canAccess("PROPERTY", propertyId, "WRITE")).isFalse();
    }

    @Test
    @DisplayName("Unrelated stranger is denied read and write access to property media")
    void strangerIsDeniedPropertyMedia() {
        authenticateUser(strangerUserId, "stranger@example.com", UserRole.USER);

        when(membershipRepository.findPermissionCodesByUserIdAndPropertyId(strangerUserId, propertyId))
                .thenReturn(Set.of());

        assertThat(mediaAuthorization.canAccess("PROPERTY", propertyId, "READ")).isFalse();
        assertThat(mediaAuthorization.canAccess("PROPERTY", propertyId, "WRITE")).isFalse();
    }

    @Test
    @DisplayName("Landlord with LEASE_UPDATE can write and read lease media")
    void landlordCanReadAndWriteLeaseMedia() {
        authenticateUser(ownerUserId, "owner@example.com", UserRole.USER);

        LeaseSummaryDTO leaseSummary = new LeaseSummaryDTO(
                leaseId,
                UUID.randomUUID(),
                "101",
                1,
                propertyId,
                "Property Alpha",
                tenantUserId,
                "ACTIVE",
                LocalDate.now(),
                LocalDate.now().plusMonths(12),
                new java.math.BigDecimal("20000.00")
        );

        when(leaseFacade.getLeaseById(leaseId)).thenReturn(Optional.of(leaseSummary));
        when(membershipRepository.findPermissionCodesByUserIdAndPropertyId(ownerUserId, propertyId))
                .thenReturn(Set.of("LEASE_UPDATE", "LEASE_VIEW"));

        assertThat(mediaAuthorization.canAccess("LEASE", leaseId, "READ")).isTrue();
        assertThat(mediaAuthorization.canAccess("LEASE", leaseId, "WRITE")).isTrue();
    }

    @Test
    @DisplayName("Tenant can read media for their own lease via LEASE_VIEW_OWN")
    void tenantCanReadOwnLeaseMedia() {
        authenticateUser(tenantUserId, "tenant@example.com", UserRole.USER);

        LeaseSummaryDTO leaseSummary = new LeaseSummaryDTO(
                leaseId,
                UUID.randomUUID(),
                "101",
                1,
                propertyId,
                "Property Alpha",
                tenantUserId,
                "ACTIVE",
                LocalDate.now(),
                LocalDate.now().plusMonths(12),
                new java.math.BigDecimal("20000.00")
        );

        when(leaseFacade.getLeaseById(leaseId)).thenReturn(Optional.of(leaseSummary));

        assertThat(mediaAuthorization.canAccess("LEASE", leaseId, "READ")).isTrue();
        assertThat(mediaAuthorization.canAccess("LEASE", leaseId, "WRITE")).isFalse();
    }

    @Test
    @DisplayName("Foreign tenant cannot access media of another tenant's lease (IDOR defense)")
    void foreignTenantCannotAccessOtherLeaseMedia() {
        authenticateUser(strangerUserId, "foreign-tenant@example.com", UserRole.USER);

        LeaseSummaryDTO leaseSummary = new LeaseSummaryDTO(
                leaseId,
                UUID.randomUUID(),
                "101",
                1,
                propertyId,
                "Property Alpha",
                tenantUserId, // Belonging to tenantUserId, not strangerUserId
                "ACTIVE",
                LocalDate.now(),
                LocalDate.now().plusMonths(12),
                new java.math.BigDecimal("20000.00")
        );

        when(leaseFacade.getLeaseById(leaseId)).thenReturn(Optional.of(leaseSummary));
        when(membershipRepository.findPermissionCodesByUserIdAndPropertyId(strangerUserId, propertyId))
                .thenReturn(Set.of());

        assertThat(mediaAuthorization.canAccess("LEASE", leaseId, "READ")).isFalse();
        assertThat(mediaAuthorization.canAccess("LEASE", leaseId, "WRITE")).isFalse();
    }


    @Test
    @DisplayName("Property manager can read and write inventory item media")
    void propertyManagerCanReadAndWriteInventoryMedia() {
        authenticateUser(ownerUserId, "owner@example.com", UserRole.USER);

        when(inventoryFacade.getPropertyIdForInventoryItem(itemId)).thenReturn(Optional.of(propertyId));
        when(membershipRepository.findPermissionCodesByUserIdAndPropertyId(ownerUserId, propertyId))
                .thenReturn(Set.of("INVENTORY_MANAGE", "INVENTORY_VIEW"));

        assertThat(mediaAuthorization.canAccess("INVENTORY_ITEM", itemId, "READ")).isTrue();
        assertThat(mediaAuthorization.canAccess("INVENTORY_ITEM", itemId, "WRITE")).isTrue();
    }

    @Test
    @DisplayName("Original uploader can delete their uploaded media asset")
    void originalUploaderCanDeleteMediaAsset() {
        authenticateUser(tenantUserId, "tenant@example.com", UserRole.USER);

        MediaDTOs.MediaAssetDTO asset = new MediaDTOs.MediaAssetDTO(
                mediaAssetId,
                "PROPERTY",
                propertyId,
                StorageProvider.CLOUDINARY,
                "ext_123",
                "https://cloudinary.com/photo.jpg",
                FileType.IMAGE,
                "living room",
                tenantUserId, // Uploaded by tenantUserId
                Instant.now()
        );

        when(storageService.getAssetById(mediaAssetId)).thenReturn(Optional.of(asset));

        assertThat(mediaAuthorization.canAccessAsset(mediaAssetId, "DELETE")).isTrue();
    }

    @Test
    @DisplayName("Property manager can delete media asset on their property even if uploaded by someone else")
    void propertyManagerCanDeleteAssetOnTheirProperty() {
        authenticateUser(ownerUserId, "owner@example.com", UserRole.USER);

        MediaDTOs.MediaAssetDTO asset = new MediaDTOs.MediaAssetDTO(
                mediaAssetId,
                "PROPERTY",
                propertyId,
                StorageProvider.CLOUDINARY,
                "ext_123",
                "https://cloudinary.com/photo.jpg",
                FileType.IMAGE,
                "living room",
                tenantUserId, // Uploaded by tenant
                Instant.now()
        );

        when(storageService.getAssetById(mediaAssetId)).thenReturn(Optional.of(asset));
        when(membershipRepository.findPermissionCodesByUserIdAndPropertyId(ownerUserId, propertyId))
                .thenReturn(Set.of("PROPERTY_EDIT"));

        assertThat(mediaAuthorization.canAccessAsset(mediaAssetId, "DELETE")).isTrue();
    }

    @Test
    @DisplayName("Unauthorized stranger cannot delete another user's or property's media asset")
    void strangerCannotDeleteMediaAsset() {
        authenticateUser(strangerUserId, "stranger@example.com", UserRole.USER);

        MediaDTOs.MediaAssetDTO asset = new MediaDTOs.MediaAssetDTO(
                mediaAssetId,
                "PROPERTY",
                propertyId,
                StorageProvider.CLOUDINARY,
                "ext_123",
                "https://cloudinary.com/photo.jpg",
                FileType.IMAGE,
                "living room",
                tenantUserId,
                Instant.now()
        );

        when(storageService.getAssetById(mediaAssetId)).thenReturn(Optional.of(asset));
        when(membershipRepository.findPermissionCodesByUserIdAndPropertyId(strangerUserId, propertyId))
                .thenReturn(Set.of());

        assertThat(mediaAuthorization.canAccessAsset(mediaAssetId, "DELETE")).isFalse();
    }

    @Test
    @DisplayName("Global Super Admin can delete any media asset")
    void superAdminCanDeleteAnyMediaAsset() {
        authenticateUser(ownerUserId, "superadmin@example.com", UserRole.SUPER_ADMIN);
        when(storageService.getAssetById(mediaAssetId)).thenReturn(Optional.of(new MediaDTOs.MediaAssetDTO(
                mediaAssetId, "PROPERTY", propertyId, StorageProvider.CLOUDINARY, "ext_123",
                "https://cloudinary.com/photo.jpg", FileType.IMAGE, null, tenantUserId, Instant.now())));

        assertThat(mediaAuthorization.canAccessAsset(mediaAssetId, "DELETE")).isTrue();
    }

    @Test
    @DisplayName("A file attached to a type no module declares is refused")
    void undeclaredOwnerTypeIsRefused() {
        authenticateUser(ownerUserId, "owner@example.com", UserRole.USER);

        assertThat(mediaAuthorization.canAccess("INVENTORY", itemId, "READ")).isFalse();
        assertThat(mediaAuthorization.canAccess(null, itemId, "READ")).isFalse();
    }

    @Test
    @DisplayName("Verify MediaController endpoints have strict PreAuthorize annotations configured")
    void verifyMediaControllerPreAuthorizeAnnotations() throws NoSuchMethodException {
        Class<MediaController> clazz = MediaController.class;

        Method uploadAuth = clazz.getMethod("requestUploadAuthorization", MediaDTOs.UploadAuthorizationRequest.class, UserDetailsImpl.class);
        PreAuthorize preAuthUploadAuth = uploadAuth.getAnnotation(PreAuthorize.class);
        assertThat(preAuthUploadAuth).isNotNull();
        assertThat(preAuthUploadAuth.value()).isEqualTo("@mediaAuthorization.canAccess(#request.ownerModule(), #request.referenceId(), 'WRITE')");

        Method confirm = clazz.getMethod("confirmUpload", MediaDTOs.ConfirmUploadRequest.class, UserDetailsImpl.class);
        PreAuthorize preAuthConfirm = confirm.getAnnotation(PreAuthorize.class);
        assertThat(preAuthConfirm).isNotNull();
        assertThat(preAuthConfirm.value()).isEqualTo("@mediaAuthorization.canAccess(#request.ownerModule(), #request.referenceId(), 'WRITE')");

        Method list = clazz.getMethod("listMediaAssets", String.class, UUID.class);
        PreAuthorize preAuthList = list.getAnnotation(PreAuthorize.class);
        assertThat(preAuthList).isNotNull();
        assertThat(preAuthList.value()).isEqualTo("@mediaAuthorization.canAccess(#ownerModule, #referenceId, 'READ')");

        Method delete = clazz.getMethod("deleteMediaAsset", UUID.class, UserDetailsImpl.class);
        PreAuthorize preAuthDelete = delete.getAnnotation(PreAuthorize.class);
        assertThat(preAuthDelete).isNotNull();
        assertThat(preAuthDelete.value()).isEqualTo("@mediaAuthorization.canAccessAsset(#id, 'DELETE')");
    }
}
