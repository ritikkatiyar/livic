package com.livic.verticals.rental.inventory;

import com.livic.platform.auth.AuthorizationTestSupport;
import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.auth.service.impl.AuthorizationServiceImpl;
import com.livic.platform.auth.service.interfaces.MembershipCrudService;
import com.livic.platform.common.domain.UserRole;
import com.livic.platform.common.enums.ResourceType;
import com.livic.verticals.rental.lease.dto.LeaseSummaryDTO;
import com.livic.verticals.rental.lease.facade.LeaseFacade;
import com.livic.verticals.rental.inventory.controller.LeaseInventoryAssignmentController;
import com.livic.verticals.rental.inventory.dto.ApproveDeductionsRequest;
import com.livic.verticals.rental.inventory.dto.CreateAssignmentRequest;
import com.livic.verticals.rental.inventory.dto.MoveOutChecklistRequest;
import com.livic.verticals.rental.inventory.dto.ReturnVerificationRequest;
import com.livic.verticals.rental.inventory.facade.InventoryFacade;
import com.livic.platform.user.dto.UserSummaryDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaseInventoryAssignmentAuthorizationTest {

    @Mock
    private MembershipCrudService membershipCrudService;

    @Mock
    private LeaseFacade leaseFacade;

    @Mock
    private InventoryFacade inventoryFacade;

    private AuthorizationServiceImpl authorizationService;

    private UUID propertyId;
    private UUID leaseId;
    private UUID assignmentId;
    private UUID ownerUserId;
    private UUID tenantUserId;
    private UUID unrelatedUserId;

    @BeforeEach
    void setUp() {
        authorizationService = AuthorizationTestSupport.authorizationService(membershipCrudService, null, null, leaseFacade, inventoryFacade, null);
        propertyId = UUID.randomUUID();
        leaseId = UUID.randomUUID();
        assignmentId = UUID.randomUUID();
        ownerUserId = UUID.randomUUID();
        tenantUserId = UUID.randomUUID();
        unrelatedUserId = UUID.randomUUID();
    }

    private void authenticateUser(UUID userId, String email) {
        UserSummaryDTO userSummary = new UserSummaryDTO(
                userId,
                email,
                "Test User",
                "+919876543210",
                UserRole.USER
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
    @DisplayName("Owner with LEASE_UPDATE permission can access write and read endpoints")
    void ownerWithLeaseUpdatePermission() {
        authenticateUser(ownerUserId, "owner@example.com");

        LeaseSummaryDTO lease = new LeaseSummaryDTO(
                leaseId,
                UUID.randomUUID(),
                "101",
                1,
                propertyId,
                "Test Property",
                tenantUserId,
                "ACTIVE",
                LocalDate.now(),
                null,
                BigDecimal.valueOf(15000)
        );

        when(leaseFacade.getLeaseById(leaseId)).thenReturn(Optional.of(lease));
        when(membershipCrudService.findPermissionCodesByUserIdAndPropertyId(ownerUserId, propertyId))
                .thenReturn(Set.of("LEASE_UPDATE", "LEASE_VIEW"));
        when(inventoryFacade.getLeaseIdForAssignment(assignmentId)).thenReturn(Optional.of(leaseId));

        // Owner has LEASE_UPDATE by leaseId
        assertThat(authorizationService.hasPermission(ResourceType.LEASE, leaseId, "LEASE_UPDATE")).isTrue();
        // Owner has LEASE_VIEW by leaseId
        assertThat(authorizationService.hasPermission(ResourceType.LEASE, leaseId, "LEASE_VIEW")).isTrue();
        // Owner has LEASE_UPDATE by assignmentId
        assertThat(authorizationService.hasPermission(ResourceType.INVENTORY_ASSIGNMENT, assignmentId, "LEASE_UPDATE")).isTrue();
    }

    @Test
    @DisplayName("Tenant on own lease has LEASE_VIEW_OWN but is rejected from LEASE_UPDATE write endpoints")
    void tenantOnOwnLeasePermissions() {
        authenticateUser(tenantUserId, "tenant@example.com");

        LeaseSummaryDTO lease = new LeaseSummaryDTO(
                leaseId,
                UUID.randomUUID(),
                "101",
                1,
                propertyId,
                "Test Property",
                tenantUserId,
                "ACTIVE",
                LocalDate.now(),
                null,
                BigDecimal.valueOf(15000)
        );

        when(leaseFacade.getLeaseById(leaseId)).thenReturn(Optional.of(lease));
        when(membershipCrudService.findPermissionCodesByUserIdAndPropertyId(tenantUserId, propertyId))
                .thenReturn(Set.of()); // Tenant does not hold property-level LEASE_UPDATE
        when(inventoryFacade.getLeaseIdForAssignment(assignmentId)).thenReturn(Optional.of(leaseId));

        // Tenant CAN read own lease assignments
        assertThat(authorizationService.hasPermission(ResourceType.LEASE, leaseId, "LEASE_VIEW_OWN")).isTrue();
        // Tenant CANNOT perform LEASE_UPDATE (create assignments, generate checklist, approve deductions)
        assertThat(authorizationService.hasPermission(ResourceType.LEASE, leaseId, "LEASE_UPDATE")).isFalse();
        // Tenant CANNOT verify return by assignmentId
        assertThat(authorizationService.hasPermission(ResourceType.INVENTORY_ASSIGNMENT, assignmentId, "LEASE_UPDATE")).isFalse();
    }

    @Test
    @DisplayName("Unrelated user with no relationship to lease is rejected from all endpoints")
    void unrelatedUserIsRejectedFromAllEndpoints() {
        authenticateUser(unrelatedUserId, "stranger@example.com");

        LeaseSummaryDTO lease = new LeaseSummaryDTO(
                leaseId,
                UUID.randomUUID(),
                "101",
                1,
                propertyId,
                "Test Property",
                tenantUserId, // Belonging to someone else
                "ACTIVE",
                LocalDate.now(),
                null,
                BigDecimal.valueOf(15000)
        );

        when(leaseFacade.getLeaseById(leaseId)).thenReturn(Optional.of(lease));
        when(membershipCrudService.findPermissionCodesByUserIdAndPropertyId(unrelatedUserId, propertyId))
                .thenReturn(Set.of());
        when(inventoryFacade.getLeaseIdForAssignment(assignmentId)).thenReturn(Optional.of(leaseId));

        // Stranger is rejected from read
        assertThat(authorizationService.hasPermission(ResourceType.LEASE, leaseId, "LEASE_VIEW")).isFalse();
        assertThat(authorizationService.hasPermission(ResourceType.LEASE, leaseId, "LEASE_VIEW_OWN")).isFalse();
        // Stranger is rejected from write
        assertThat(authorizationService.hasPermission(ResourceType.LEASE, leaseId, "LEASE_UPDATE")).isFalse();
        // Stranger is rejected from verifyReturn by assignmentId
        assertThat(authorizationService.hasPermission(ResourceType.INVENTORY_ASSIGNMENT, assignmentId, "LEASE_UPDATE")).isFalse();
    }

    @Test
    @DisplayName("Verify LeaseInventoryAssignmentController has exact PreAuthorize annotations configured")
    void verifyControllerPreAuthorizeAnnotations() throws NoSuchMethodException {
        Class<LeaseInventoryAssignmentController> clazz = LeaseInventoryAssignmentController.class;

        Method createAssignments = clazz.getMethod("createAssignments", UUID.class, CreateAssignmentRequest.class, UserDetailsImpl.class);
        PreAuthorize preAuthCreate = createAssignments.getAnnotation(PreAuthorize.class);
        assertThat(preAuthCreate).isNotNull();
        assertThat(preAuthCreate.value()).isEqualTo("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).LEASE, #leaseId, 'LEASE_UPDATE')");

        Method getAssignments = clazz.getMethod("getAssignments", UUID.class, Pageable.class);
        PreAuthorize preAuthGet = getAssignments.getAnnotation(PreAuthorize.class);
        assertThat(preAuthGet).isNotNull();
        assertThat(preAuthGet.value()).isEqualTo("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).LEASE, #leaseId, 'LEASE_VIEW') or @authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).LEASE, #leaseId, 'LEASE_VIEW_OWN')");

        Method generateChecklist = clazz.getMethod("generateMoveOutChecklist", UUID.class, MoveOutChecklistRequest.class, UserDetailsImpl.class);
        PreAuthorize preAuthChecklist = generateChecklist.getAnnotation(PreAuthorize.class);
        assertThat(preAuthChecklist).isNotNull();
        assertThat(preAuthChecklist.value()).isEqualTo("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).LEASE, #leaseId, 'LEASE_UPDATE')");

        Method verifyReturn = clazz.getMethod("verifyReturn", UUID.class, ReturnVerificationRequest.class, UserDetailsImpl.class);
        PreAuthorize preAuthVerify = verifyReturn.getAnnotation(PreAuthorize.class);
        assertThat(preAuthVerify).isNotNull();
        assertThat(preAuthVerify.value()).isEqualTo("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).INVENTORY_ASSIGNMENT, #assignmentId, 'LEASE_UPDATE')");

        Method approveDeductions = clazz.getMethod("approveDeductions", UUID.class, ApproveDeductionsRequest.class, UserDetailsImpl.class);
        PreAuthorize preAuthApprove = approveDeductions.getAnnotation(PreAuthorize.class);
        assertThat(preAuthApprove).isNotNull();
        assertThat(preAuthApprove.value()).isEqualTo("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).LEASE, #leaseId, 'LEASE_UPDATE')");

        Method getChecklist = clazz.getMethod("getVerificationChecklist", UUID.class, Pageable.class);
        PreAuthorize preAuthGetChecklist = getChecklist.getAnnotation(PreAuthorize.class);
        assertThat(preAuthGetChecklist).isNotNull();
        assertThat(preAuthGetChecklist.value()).isEqualTo("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).LEASE, #leaseId, 'LEASE_VIEW') or @authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).LEASE, #leaseId, 'LEASE_VIEW_OWN')");
    }
}
