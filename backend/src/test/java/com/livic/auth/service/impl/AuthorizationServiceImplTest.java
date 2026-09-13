package com.livic.auth.service.impl;

import com.livic.auth.AuthorizationTestSupport;
import com.livic.security.UserDetailsImpl;
import com.livic.auth.service.interfaces.MembershipCrudService;
import com.livic.common.domain.FacingDirection;
import com.livic.common.domain.UnitType;
import com.livic.common.domain.UserRole;
import com.livic.common.enums.AccessType;
import com.livic.common.enums.ResourceType;
import com.livic.finance.dto.ChargeConfigResponse;
import com.livic.finance.dto.LeaseSummaryDTO;
import com.livic.finance.facade.FinanceFacade;
import com.livic.inventory.facade.InventoryFacade;
import com.livic.property.dto.UnitSummaryDTO;
import com.livic.property.facade.UnitFacade;
import com.livic.storage.dto.MediaDTOs;
import com.livic.storage.facade.StorageFacade;
import com.livic.user.dto.UserSummaryDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthorizationServiceImplTest {

    @Mock
    private MembershipCrudService membershipCrudService;

    @Mock
    private UnitFacade unitFacade;

    @Mock
    private FinanceFacade financeFacade;

    @Mock
    private InventoryFacade inventoryFacade;

    @Mock
    private StorageFacade storageFacade;

    private AuthorizationServiceImpl authorizationService;

    private UUID propertyId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        authorizationService = AuthorizationTestSupport.authorizationService(membershipCrudService, unitFacade, financeFacade, inventoryFacade, storageFacade);
        propertyId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    private void authenticateUser(UUID uId, UserRole role) {
        UserSummaryDTO userSummary = new UserSummaryDTO(
                uId,
                "test@livic.com",
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
    @DisplayName("Super Admin user is globally authorized for all permissions")
    void superAdminIsGloballyAuthorized() {
        authenticateUser(userId, UserRole.SUPER_ADMIN);
        assertThat(authorizationService.hasPermission(propertyId, "ANY_PERMISSION")).isTrue();
        assertThat(authorizationService.hasFullAccess(propertyId)).isTrue();
    }

    @Test
    @DisplayName("User with FULL_ACCESS role automatically passes any property permission check")
    void userWithFullAccessRoleBypassesIndividualPermissionChecks() {
        authenticateUser(userId, UserRole.USER);
        when(membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(true);

        assertThat(authorizationService.hasFullAccess(propertyId)).isTrue();
        assertThat(authorizationService.hasPermission(propertyId, "MANAGE_STAFF")).isTrue();
        assertThat(authorizationService.hasPermission(propertyId, "PROPERTY_EDIT")).isTrue();
        assertThat(authorizationService.hasPermission(propertyId, "NON_EXISTENT_PERM")).isTrue();
    }

    @Test
    @DisplayName("User with CUSTOM_ACCESS role only passes granted permissions")
    void userWithCustomAccessRoleRespectsPermissionMatrix() {
        authenticateUser(userId, UserRole.USER);
        when(membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(false);
        when(membershipCrudService.findPermissionCodesByUserIdAndPropertyId(userId, propertyId))
                .thenReturn(Set.of("PROPERTY_VIEW", "MAINTENANCE_VIEW"));

        assertThat(authorizationService.hasFullAccess(propertyId)).isFalse();
        assertThat(authorizationService.hasPermission(propertyId, "PROPERTY_VIEW")).isTrue();
        assertThat(authorizationService.hasPermission(propertyId, "PROPERTY_EDIT")).isFalse();
    }

    @Test
    @DisplayName("Generic ResourceType resolution works for Unit, Lease, ChargeConfig")
    void genericResourceResolutionWorks() {
        authenticateUser(userId, UserRole.USER);
        UUID unitId = UUID.randomUUID();
        UUID chargeConfigId = UUID.randomUUID();

        // 1. Unit -> Property
        UnitSummaryDTO unit = new UnitSummaryDTO(unitId, propertyId, "Test Property", "101", 1, 2, 0, 0, 1, 1, UnitType.SINGLE_UNIT, FacingDirection.NORTH);
        when(unitFacade.getUnitById(unitId)).thenReturn(Optional.of(unit));
        when(membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(true);

        assertThat(authorizationService.hasPermission(ResourceType.UNIT, unitId, "LEASE_CREATE")).isTrue();

        // 2. Charge Config -> Property
        ChargeConfigResponse charge = ChargeConfigResponse.builder()
                .id(chargeConfigId)
                .propertyId(propertyId)
                .chargeName("Rent")
                .build();
        when(financeFacade.getChargeConfigById(chargeConfigId)).thenReturn(charge);

        assertThat(authorizationService.hasPermission(ResourceType.CHARGE_CONFIG, chargeConfigId, "PROPERTY_EDIT")).isTrue();
    }

    @Test
    @DisplayName("Multi-Tenant Isolation: Owner of Property A is strictly denied access to Property B")
    void multiTenantIsolationOwnerCannotAccessOtherProperty() {
        authenticateUser(userId, UserRole.USER);
        UUID propertyBId = UUID.randomUUID();

        // User only has membership in propertyId, NOT propertyBId
        when(membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(userId, propertyBId, AccessType.FULL_ACCESS))
                .thenReturn(false);
        when(membershipCrudService.findPermissionCodesByUserIdAndPropertyId(userId, propertyBId))
                .thenReturn(Set.of());

        assertThat(authorizationService.hasFullAccess(propertyBId)).isFalse();
        assertThat(authorizationService.hasPermission(propertyBId, "PROPERTY_VIEW")).isFalse();
        assertThat(authorizationService.hasPermission(propertyBId, "PROPERTY_EDIT")).isFalse();
        assertThat(authorizationService.hasPermission(propertyBId, "MANAGE_STAFF")).isFalse();
    }

    @Test
    @DisplayName("Custom Access RBAC: Staff with view-only permissions is denied administrative permissions")
    void customAccessDeniedForUngrantedStaffAndFinancePermissions() {
        authenticateUser(userId, UserRole.USER);

        when(membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(false);
        when(membershipCrudService.findPermissionCodesByUserIdAndPropertyId(userId, propertyId))
                .thenReturn(Set.of("PROPERTY_VIEW"));

        assertThat(authorizationService.hasPermission(propertyId, "PROPERTY_VIEW")).isTrue();
        assertThat(authorizationService.hasPermission(propertyId, "PROPERTY_EDIT")).isFalse();
        assertThat(authorizationService.hasPermission(propertyId, "MANAGE_STAFF")).isFalse();
        assertThat(authorizationService.hasPermission(propertyId, "LEASE_CREATE")).isFalse();
        assertThat(authorizationService.hasPermission(propertyId, "EXPENSE_CREATE")).isFalse();
    }

    @Test
    @DisplayName("Cross-Tenant IDOR Protection: Tenant A can view own lease but is denied access to Tenant B lease")
    void crossTenantIdorLeaseViewOwnProtection() {
        authenticateUser(userId, UserRole.USER);
        UUID leaseAId = UUID.randomUUID();
        UUID leaseBId = UUID.randomUUID();
        UUID tenantBUserId = UUID.randomUUID();

        LeaseSummaryDTO leaseA = new LeaseSummaryDTO(
                leaseAId, UUID.randomUUID(), "101", 1, propertyId, "Property A", userId, "ACTIVE", null, null, null
        );
        LeaseSummaryDTO leaseB = new LeaseSummaryDTO(
                leaseBId, UUID.randomUUID(), "102", 1, propertyId, "Property A", tenantBUserId, "ACTIVE", null, null, null
        );

        when(financeFacade.getLeaseById(leaseAId)).thenReturn(Optional.of(leaseA));
        when(financeFacade.getLeaseById(leaseBId)).thenReturn(Optional.of(leaseB));

        // Tenant A accessing own lease -> Granted
        assertThat(authorizationService.hasPermission(ResourceType.LEASE, leaseAId, "LEASE_VIEW_OWN")).isTrue();

        // Tenant A accessing Tenant B lease -> Denied
        when(membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(false);
        when(membershipCrudService.findPermissionCodesByUserIdAndPropertyId(userId, propertyId))
                .thenReturn(Set.of());

        assertThat(authorizationService.hasPermission(ResourceType.LEASE, leaseBId, "LEASE_VIEW_OWN")).isFalse();
        assertThat(authorizationService.hasPermission(ResourceType.LEASE, leaseBId, "LEASE_VIEW")).isFalse();
    }

    @Test
    @DisplayName("Cross-Tenant Rent Cycle: User without property membership cannot access rent cycle")
    void rentCycleCrossTenantAccessBlocked() {
        authenticateUser(userId, UserRole.USER);
        UUID rentCycleId = UUID.randomUUID();
        UUID foreignPropertyId = UUID.randomUUID();

        when(financeFacade.getPropertyIdByRentCycleId(rentCycleId)).thenReturn(Optional.of(foreignPropertyId));
        when(membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(userId, foreignPropertyId, AccessType.FULL_ACCESS))
                .thenReturn(false);
        when(membershipCrudService.findPermissionCodesByUserIdAndPropertyId(userId, foreignPropertyId))
                .thenReturn(Set.of());

        assertThat(authorizationService.hasPermission(ResourceType.RENT_CYCLE, rentCycleId, "PROPERTY_VIEW")).isFalse();
        assertThat(authorizationService.hasPermission(ResourceType.RENT_CYCLE, rentCycleId, "PROPERTY_EDIT")).isFalse();
    }

    @Test
    @DisplayName("Lease ownership only grants LEASE_VIEW_OWN, not other lease permissions")
    void leaseOwnershipDoesNotGrantOtherPermissions() {
        authenticateUser(userId, UserRole.USER);
        UUID leaseId = UUID.randomUUID();
        LeaseSummaryDTO lease = new LeaseSummaryDTO(leaseId, UUID.randomUUID(), "101", 1, propertyId, "Property",
                userId, "ACTIVE", null, null, null);

        when(financeFacade.getLeaseById(leaseId)).thenReturn(Optional.of(lease));
        when(membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(false);
        when(membershipCrudService.findPermissionCodesByUserIdAndPropertyId(userId, propertyId))
                .thenReturn(Set.of());

        assertThat(authorizationService.hasPermission(ResourceType.LEASE, leaseId, "LEASE_VIEW_OWN")).isTrue();
        assertThat(authorizationService.hasPermission(ResourceType.LEASE, leaseId, "LEASE_UPDATE")).isFalse();
    }

    @Test
    @DisplayName("Full access on an inventory assignment resolves through its lease to the property")
    void fullAccessResolvesInventoryAssignmentThroughLease() {
        authenticateUser(userId, UserRole.USER);
        UUID assignmentId = UUID.randomUUID();
        UUID leaseId = UUID.randomUUID();
        LeaseSummaryDTO lease = new LeaseSummaryDTO(leaseId, UUID.randomUUID(), "101", 1, propertyId, "Property",
                UUID.randomUUID(), "ACTIVE", null, null, null);

        when(inventoryFacade.getLeaseIdForAssignment(assignmentId)).thenReturn(Optional.of(leaseId));
        when(financeFacade.getLeaseById(leaseId)).thenReturn(Optional.of(lease));
        when(membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(true);

        assertThat(authorizationService.hasFullAccess(ResourceType.INVENTORY_ASSIGNMENT, assignmentId)).isTrue();
    }

    @Test
    @DisplayName("Media asset without an owner module is accessible only to its uploader")
    void orphanMediaAssetOnlyAccessibleToUploader() {
        UUID mediaAssetId = UUID.randomUUID();
        MediaDTOs.MediaAssetDTO asset = new MediaDTOs.MediaAssetDTO(mediaAssetId, null, null, null, "ext", "url",
                null, null, userId, Instant.now());
        when(storageFacade.getAssetById(mediaAssetId)).thenReturn(Optional.of(asset));

        authenticateUser(userId, UserRole.USER);
        assertThat(authorizationService.hasMediaAssetAccess(mediaAssetId, "DELETE")).isTrue();

        authenticateUser(UUID.randomUUID(), UserRole.USER);
        assertThat(authorizationService.hasMediaAssetAccess(mediaAssetId, "READ")).isFalse();
        assertThat(authorizationService.hasFullAccess(ResourceType.MEDIA_ASSET, mediaAssetId)).isFalse();
    }
}
