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
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

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

        assertThat(search).isNotNull();
        assertThat(search.value()).isEqualTo(LEASE_CREATE_ON_PROPERTY);
        // People sign up themselves; nobody can create an account for someone else.
        assertThat(java.util.Arrays.stream(UserController.class.getMethods()).map(java.lang.reflect.Method::getName))
                .doesNotContain("createTenant");
    }

    @Test
    @DisplayName("Lookup matches the whole number only; a fragment finds nobody")
    void lookupMatchesWholeNumberOnly() {
        UserRepository userRepository = mock(UserRepository.class);
        UserTbl tenant = UserTbl.builder().authUid("tenant@example.com").fullName("Tenant").phoneNumber("+919876543210").build();
        tenant.setId(UUID.randomUUID());
        when(userRepository.findByPhoneNumber("+919876543210")).thenReturn(Optional.of(tenant));
        UserQueryServiceImpl userQueryService = new UserQueryServiceImpl(userRepository);

        // A number still being typed is not looked up at all.
        assertThat(userQueryService.lookupByPhoneNumber("98765")).isEmpty();
        verify(userRepository, never()).findByPhoneNumber("98765");
        // However the whole number is written, it is the same person, and not yet confirmed by a code.
        for (String typed : List.of(" 9876543210 ", "+91 98765 43210", "098765-43210", "919876543210")) {
            assertThat(userQueryService.lookupByPhoneNumber(typed))
                    .as(typed)
                    .singleElement()
                    .satisfies(found -> {
                        assertThat(found.id()).isEqualTo(tenant.getId());
                        assertThat(found.phoneVerified()).isFalse();
                    });
        }
    }
}
