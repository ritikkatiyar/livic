package com.livic.platform.user;

import com.livic.platform.user.controller.UserController;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.dto.UserDTOs;
import com.livic.platform.user.repository.UserRepository;
import com.livic.platform.user.service.impl.UserQueryServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * User search used to return up to ten accounts for any fragment of a phone number to any
 * signed-in user, which was enough to list everyone's name, email and phone.
 */
class UserLookupAccessTest {

    private static final String LEASE_CREATE_ON_PROPERTY = "@authorizationService.hasPermission(#propertyId, 'LEASE_CREATE')";

    @Test
    @DisplayName("Looking up and creating a tenant both need lease permission on the property")
    void lookupAndCreateNeedLeasePermission() throws NoSuchMethodException {
        PreAuthorize search = UserController.class
                .getMethod("searchByPhone", String.class, UUID.class)
                .getAnnotation(PreAuthorize.class);
        PreAuthorize createTenant = UserController.class
                .getMethod("createTenant", UUID.class, UserDTOs.CreateTenantRequest.class)
                .getAnnotation(PreAuthorize.class);

        assertThat(search).isNotNull();
        assertThat(search.value()).isEqualTo(LEASE_CREATE_ON_PROPERTY);
        assertThat(createTenant).isNotNull();
        assertThat(createTenant.value()).isEqualTo(LEASE_CREATE_ON_PROPERTY);
    }

    @Test
    @DisplayName("Lookup matches the whole number only; a fragment finds nobody")
    void lookupMatchesWholeNumberOnly() {
        UserRepository userRepository = mock(UserRepository.class);
        UserTbl tenant = UserTbl.builder().authUid("tenant@example.com").fullName("Tenant").phoneNumber("9876543210").build();
        tenant.setId(UUID.randomUUID());
        when(userRepository.findByPhoneNumber(anyString())).thenReturn(Optional.empty());
        when(userRepository.findByPhoneNumber("9876543210")).thenReturn(Optional.of(tenant));
        UserQueryServiceImpl userQueryService = new UserQueryServiceImpl(userRepository);

        assertThat(userQueryService.lookupByPhoneNumber("98765")).isEmpty();
        assertThat(userQueryService.lookupByPhoneNumber(" 9876543210 "))
                .extracting(UserDTOs.UserSearchResponse::id)
                .containsExactly(tenant.getId());
    }
}
