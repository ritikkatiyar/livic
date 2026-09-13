package com.livic.auth;

import com.livic.auth.dto.AuthRequests.LoginRequest;
import com.livic.auth.dto.AuthRequests.SignupRequest;
import com.livic.auth.dto.AuthResponses.TokenBundle;
import com.livic.auth.provider.AuthProviderType;
import com.livic.auth.provider.ExternalIdentityProvider;
import com.livic.auth.provider.ResolvedIdentity;
import com.livic.auth.service.interfaces.AuthService;
import com.livic.auth.service.interfaces.OAuthLoginService;
import com.livic.common.exception.BusinessException;
import com.livic.user.facade.UserFacade;
import com.livic.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class OAuthAccountLinkingIntegrationTest {

    private static final String PASSWORD = "Str0ng!Pass";

    /** Stands in for Google (disabled in tests). Tokens are "subject|email" and always carry a verified email. */
    @TestConfiguration
    static class FakeGoogleProviderConfig {
        @Bean
        ExternalIdentityProvider fakeGoogleProvider() {
            return new ExternalIdentityProvider() {
                @Override
                public AuthProviderType type() {
                    return AuthProviderType.GOOGLE;
                }

                @Override
                public ResolvedIdentity verify(String idToken) {
                    String[] parts = idToken.split("\\|");
                    return new ResolvedIdentity(parts[0], parts[1], true, "Google User");
                }
            };
        }
    }

    @Autowired private AuthService authService;
    @Autowired private OAuthLoginService oAuthLoginService;
    @Autowired private UserFacade userFacade;
    @Autowired private UserRepository userRepository;

    @Test
    void googleSignInOnUnverifiedAccountRemovesPasswordSetBeforeOwnershipWasProven() {
        String victimEmail = uniqueEmail();
        // Attacker registers the victim's email with a password they know and never verifies it
        authService.signup(new SignupRequest(victimEmail, PASSWORD, "Attacker", null));

        // The real owner later signs in with Google, which proves mailbox ownership
        TokenBundle tokens = oAuthLoginService.login("google", "google-sub-" + UUID.randomUUID() + "|" + victimEmail);
        assertNotNull(tokens.accessToken());

        UUID userId = userFacade.getUserByEmail(victimEmail).orElseThrow().id();
        assertTrue(userFacade.isEmailVerified(userId));
        assertNull(userRepository.findById(userId).orElseThrow().getPasswordHash());

        BusinessException attackerLogin = assertThrows(BusinessException.class,
                () -> authService.login(new LoginRequest(victimEmail, PASSWORD)));
        assertEquals(HttpStatus.UNAUTHORIZED, attackerLogin.getStatus());
    }

    @Test
    void googleSignInOnVerifiedPasswordAccountKeepsThePassword() {
        String email = uniqueEmail();
        userFacade.createUser(email, "Existing User", null, PASSWORD);

        oAuthLoginService.login("google", "google-sub-" + UUID.randomUUID() + "|" + email);

        assertNotNull(authService.login(new LoginRequest(email, PASSWORD)).accessToken());
    }

    private static String uniqueEmail() {
        return "oauth-link-" + UUID.randomUUID() + "@example.com";
    }
}
