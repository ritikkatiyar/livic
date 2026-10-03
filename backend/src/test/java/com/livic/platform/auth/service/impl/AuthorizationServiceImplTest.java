package com.livic.platform.auth.service.impl;

import com.livic.core.finance.security.FinanceResources;
import com.livic.verticals.rental.lease.security.LeaseResources;
import com.livic.core.property.security.PropertyResources;
import com.livic.verticals.rental.inventory.security.InventoryResources;
import com.livic.platform.auth.repository.MembershipRepository;
import com.livic.platform.auth.AuthorizationTestSupport;
import com.livic.platform.security.UserDetailsImpl;
import com.livic.core.property.domain.FacingDirection;
import com.livic.core.property.domain.UnitType;
import com.livic.platform.common.domain.UserRole;
import com.livic.platform.common.enums.AccessType;
import com.livic.core.finance.dto.ChargeConfigResponse;
import com.livic.verticals.rental.lease.dto.LeaseSummaryDTO;
import com.livic.verticals.rental.lease.facade.LeaseFacade;
import com.livic.verticals.rental.inventory.facade.InventoryFacade;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.UnitFacade;
import com.livic.platform.user.dto.UserSummaryDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthorizationServiceImplTest {

    @Mock
    private MembershipRepository membershipRepository;

    @Mock
    private UnitFacade unitFacade;

    @Mock
    private LeaseFacade leaseFacade;

    @Mock
    private com.livic.core.finance.facade.FinanceFacade financeFacade;

    @Mock
    private InventoryFacade inventoryFacade;


    private AuthorizationServiceImpl authorizationService;

    private UUID propertyId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        authorizationService = AuthorizationTestSupport.authorizationService(membershipRepository, unitFacade, financeFacade, leaseFacade, inventoryFacade);
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
        when(membershipRepository.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS))
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
        when(membershipRepository.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(false);
        when(membershipRepository.findPermissionCodesByUserIdAndPropertyId(userId, propertyId))
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
        when(membershipRepository.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(true);

        assertThat(authorizationService.hasPermission(PropertyResources.UNIT, unitId, "LEASE_CREATE")).isTrue();

        // 2. Charge Config -> Property
        ChargeConfigResponse charge = ChargeConfigResponse.builder()
                .id(chargeConfigId)
                .propertyId(propertyId)
                .chargeName("Rent")
                .build();
        when(financeFacade.getChargeConfigById(chargeConfigId)).thenReturn(charge);

        assertThat(authorizationService.hasPermission(FinanceResources.CHARGE_CONFIG, chargeConfigId, "PROPERTY_EDIT")).isTrue();
    }

    @Test
    @DisplayName("Multi-Tenant Isolation: Owner of Property A is strictly denied access to Property B")
    void multiTenantIsolationOwnerCannotAccessOtherProperty() {
        authenticateUser(userId, UserRole.USER);
        UUID propertyBId = UUID.randomUUID();

        // User only has membership in propertyId, NOT propertyBId
        when(membershipRepository.existsByUserIdAndPropertyIdAndAccessType(userId, propertyBId, AccessType.FULL_ACCESS))
                .thenReturn(false);
        when(membershipRepository.findPermissionCodesByUserIdAndPropertyId(userId, propertyBId))
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

        when(membershipRepository.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(false);
        when(membershipRepository.findPermissionCodesByUserIdAndPropertyId(userId, propertyId))
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

        when(leaseFacade.getLeaseById(leaseAId)).thenReturn(Optional.of(leaseA));
        when(leaseFacade.getLeaseById(leaseBId)).thenReturn(Optional.of(leaseB));

        // Tenant A accessing own lease -> Granted
        assertThat(authorizationService.hasPermission(LeaseResources.LEASE, leaseAId, "LEASE_VIEW_OWN")).isTrue();

        // Tenant A accessing Tenant B lease -> Denied
        when(membershipRepository.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(false);
        when(membershipRepository.findPermissionCodesByUserIdAndPropertyId(userId, propertyId))
                .thenReturn(Set.of());

        assertThat(authorizationService.hasPermission(LeaseResources.LEASE, leaseBId, "LEASE_VIEW_OWN")).isFalse();
        assertThat(authorizationService.hasPermission(LeaseResources.LEASE, leaseBId, "LEASE_VIEW")).isFalse();
    }

    @Test
    @DisplayName("A user outside the bill's property cannot see it, not even as an owner of nothing")
    void billCrossTenantAccessBlocked() {
        authenticateUser(userId, UserRole.USER);
        UUID billId = UUID.randomUUID();
        UUID foreignPropertyId = UUID.randomUUID();

        when(financeFacade.getBillScope(billId)).thenReturn(Optional.of(
                new com.livic.core.finance.facade.FinanceFacade.BillScope(foreignPropertyId, UUID.randomUUID())));
        when(membershipRepository.existsByUserIdAndPropertyIdAndAccessType(userId, foreignPropertyId, AccessType.FULL_ACCESS))
                .thenReturn(false);
        when(membershipRepository.findPermissionCodesByUserIdAndPropertyId(userId, foreignPropertyId))
                .thenReturn(Set.of());

        assertThat(authorizationService.hasPermission(FinanceResources.BILL, billId, "BILL_VIEW")).isFalse();
        assertThat(authorizationService.hasPermission(FinanceResources.BILL, billId, "BILL_MANAGE")).isFalse();
        assertThat(authorizationService.hasPermission(FinanceResources.BILL, billId, "BILL_VIEW_OWN")).isFalse();
    }

    @Test
    @DisplayName("A bill belongs to its payer: they see their own bill, staff need BILL_VIEW, and no lease is involved")
    void billBelongsToItsPayer() {
        authenticateUser(userId, UserRole.USER);
        UUID billId = UUID.randomUUID();

        when(financeFacade.getBillScope(billId)).thenReturn(Optional.of(new com.livic.core.finance.facade.FinanceFacade.BillScope(propertyId, userId)));
        when(membershipRepository.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(false);
        when(membershipRepository.findPermissionCodesByUserIdAndPropertyId(userId, propertyId))
                .thenReturn(Set.of());

        // The payer (a tenant, or an owner with no lease) can see their own bill …
        assertThat(authorizationService.hasPermission(FinanceResources.BILL, billId, "BILL_VIEW_OWN")).isTrue();
        // … but paying it does not grant staff permissions on it
        assertThat(authorizationService.hasPermission(FinanceResources.BILL, billId, "BILL_VIEW")).isFalse();
        assertThat(authorizationService.hasPermission(FinanceResources.BILL, billId, "BILL_MANAGE")).isFalse();
    }

    @Test
    @DisplayName("Staff with BILL_VIEW on the property can view a bill they do not pay")
    void billVisibleToStaffWithBillView() {
        authenticateUser(userId, UserRole.USER);
        UUID billId = UUID.randomUUID();

        when(financeFacade.getBillScope(billId)).thenReturn(Optional.of(new com.livic.core.finance.facade.FinanceFacade.BillScope(propertyId, UUID.randomUUID())));
        when(membershipRepository.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(false);
        when(membershipRepository.findPermissionCodesByUserIdAndPropertyId(userId, propertyId))
                .thenReturn(Set.of("BILL_VIEW"));

        assertThat(authorizationService.hasPermission(FinanceResources.BILL, billId, "BILL_VIEW")).isTrue();
        assertThat(authorizationService.hasPermission(FinanceResources.BILL, billId, "BILL_VIEW_OWN")).isFalse();
    }

    @Test
    @DisplayName("Lease ownership only grants LEASE_VIEW_OWN, not other lease permissions")
    void leaseOwnershipDoesNotGrantOtherPermissions() {
        authenticateUser(userId, UserRole.USER);
        UUID leaseId = UUID.randomUUID();
        LeaseSummaryDTO lease = new LeaseSummaryDTO(leaseId, UUID.randomUUID(), "101", 1, propertyId, "Property",
                userId, "ACTIVE", null, null, null);

        when(leaseFacade.getLeaseById(leaseId)).thenReturn(Optional.of(lease));
        when(membershipRepository.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(false);
        when(membershipRepository.findPermissionCodesByUserIdAndPropertyId(userId, propertyId))
                .thenReturn(Set.of());

        assertThat(authorizationService.hasPermission(LeaseResources.LEASE, leaseId, "LEASE_VIEW_OWN")).isTrue();
        assertThat(authorizationService.hasPermission(LeaseResources.LEASE, leaseId, "LEASE_UPDATE")).isFalse();
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
        when(leaseFacade.getLeaseById(leaseId)).thenReturn(Optional.of(lease));
        when(membershipRepository.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(true);

        assertThat(authorizationService.hasFullAccess(InventoryResources.ASSIGNMENT, assignmentId)).isTrue();
    }
}
