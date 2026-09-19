package com.livic.core.finance;

import com.livic.platform.auth.AuthorizationTestSupport;
import com.livic.platform.auth.service.impl.AuthorizationServiceImpl;
import com.livic.platform.auth.service.interfaces.MembershipCrudService;
import com.livic.platform.common.domain.UserRole;
import com.livic.platform.common.enums.AccessType;
import com.livic.platform.security.UserDetailsImpl;
import com.livic.core.finance.controller.InvoiceController;
import com.livic.core.finance.controller.RentCycleController;
import com.livic.core.finance.controller.LeaseController;
import org.junit.jupiter.api.AfterEach;
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
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaseAuthorizationTest {

    @Mock
    private MembershipCrudService membershipCrudService;

    private AuthorizationServiceImpl authorizationService;

    private UUID propertyId;

    @BeforeEach
    void setUp() {
        authorizationService = AuthorizationTestSupport.authorizationService(membershipCrudService, null, null, null, null);
        propertyId = UUID.randomUUID();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateUser(UUID userId) {
        UserDetailsImpl userDetails = UserDetailsImpl.fromClaims(userId.toString(), "auth-" + userId, UserRole.USER.name());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities()));
    }

    @Test
    @DisplayName("Listing leases by property requires LEASE_VIEW on that property")
    void listLeasesByPropertyIsAuthorized() throws NoSuchMethodException {
        Method list = LeaseController.class.getMethod("getActiveLeasesByProperty", UserDetailsImpl.class, UUID.class, Pageable.class);
        PreAuthorize preAuthorize = list.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value())
                .isEqualTo("#propertyId == null or @authorizationService.hasPermission(#propertyId, 'LEASE_VIEW')");
    }

    @Test
    @DisplayName("User with no membership on the property cannot view its leases")
    void unrelatedUserIsRejected() {
        UUID strangerId = UUID.randomUUID();
        authenticateUser(strangerId);
        when(membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(strangerId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(false);
        when(membershipCrudService.findPermissionCodesByUserIdAndPropertyId(strangerId, propertyId))
                .thenReturn(Set.of());

        assertThat(authorizationService.hasPermission(propertyId, "LEASE_VIEW")).isFalse();
    }

    @Test
    @DisplayName("Staff without LEASE_VIEW cannot view leases; staff with it can")
    void staffNeedsLeaseView() {
        UUID staffId = UUID.randomUUID();
        authenticateUser(staffId);
        when(membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(staffId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(false);
        when(membershipCrudService.findPermissionCodesByUserIdAndPropertyId(staffId, propertyId))
                .thenReturn(Set.of("ISSUE_VIEW"), Set.of("LEASE_VIEW"));

        assertThat(authorizationService.hasPermission(propertyId, "LEASE_VIEW")).isFalse();
        assertThat(authorizationService.hasPermission(propertyId, "LEASE_VIEW")).isTrue();
    }

    @Test
    @DisplayName("Property owner with full access can view leases")
    void fullAccessOwnerIsAllowed() {
        UUID ownerId = UUID.randomUUID();
        authenticateUser(ownerId);
        when(membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(ownerId, propertyId, AccessType.FULL_ACCESS))
                .thenReturn(true);

        assertThat(authorizationService.hasPermission(propertyId, "LEASE_VIEW")).isTrue();
    }

    @Test
    @DisplayName("Listing rent cycles for a property requires RENT_ROLL_VIEW, rather than returning an empty page")
    void rentCycleListIsAuthorized() throws NoSuchMethodException {
        Method list = java.util.Arrays.stream(RentCycleController.class.getMethods())
                .filter(m -> m.getName().equals("list"))
                .findFirst()
                .orElseThrow();
        PreAuthorize preAuthorize = list.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value())
                .isEqualTo("#propertyId == null or @authorizationService.hasPermission(#propertyId, 'RENT_ROLL_VIEW')");
    }

    @Test
    @DisplayName("Invoice HTML requires lease access on the rent cycle, with no role escape hatch")
    void invoiceEndpointIsAuthorized() throws NoSuchMethodException {
        Method invoice = InvoiceController.class.getMethod("getPaymentStatementHtml", UUID.class);
        PreAuthorize preAuthorize = invoice.getAnnotation(PreAuthorize.class);

        assertThat(preAuthorize).isNotNull();
        assertThat(preAuthorize.value()).doesNotContain("hasAnyRole");
        assertThat(preAuthorize.value()).contains("RENT_CYCLE, #rentCycleId, 'LEASE_VIEW'");
        assertThat(preAuthorize.value()).contains("RENT_CYCLE, #rentCycleId, 'LEASE_VIEW_OWN'");
    }
}
