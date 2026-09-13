package com.livic.auth;

import com.livic.auth.domain.EmailVerificationTbl;
import com.livic.auth.dto.AuthRequests.LoginRequest;
import com.livic.auth.dto.AuthRequests.SignupRequest;
import com.livic.auth.dto.AuthResponses.SignupResponse;
import com.livic.auth.dto.AuthResponses.TokenBundle;
import com.livic.auth.repository.EmailVerificationRepository;
import com.livic.auth.service.JwtService;
import com.livic.auth.service.interfaces.AuthService;
import com.livic.auth.service.interfaces.EmailVerificationService;
import com.livic.common.domain.UserRole;
import com.livic.common.event.EmailVerificationRequestedEvent;
import com.livic.common.exception.BusinessException;
import com.livic.user.domain.UserTbl;
import com.livic.user.facade.UserFacade;
import com.livic.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
@RecordApplicationEvents
class AuthSignupVerificationIntegrationTest {

    private static final String PASSWORD = "Str0ng!Pass";

    @Autowired private AuthService authService;
    @Autowired private EmailVerificationService emailVerificationService;
    @Autowired private EmailVerificationRepository emailVerificationRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private UserFacade userFacade;
    @Autowired private JwtService jwtService;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private ApplicationEvents events;

    @Test
    void signupRequiresVerificationBeforeLogin() {
        String email = uniqueEmail();

        SignupResponse response = authService.signup(new SignupRequest(email, PASSWORD, "New User", null));
        assertEquals("VERIFICATION_REQUIRED", response.status());

        BusinessException blocked = assertThrows(BusinessException.class,
                () -> authService.login(new LoginRequest(email, PASSWORD)));
        assertEquals(HttpStatus.FORBIDDEN, blocked.getStatus());

        TokenBundle tokens = emailVerificationService.verify(email, lastCode());
        assertNotNull(tokens.accessToken());
        assertNotNull(authService.login(new LoginRequest(email, PASSWORD)).accessToken());
    }

    @Test
    void wrongPasswordOnUnverifiedAccountIsUnauthorizedNotForbidden() {
        String email = uniqueEmail();
        authService.signup(new SignupRequest(email, PASSWORD, "New User", null));

        BusinessException error = assertThrows(BusinessException.class,
                () -> authService.login(new LoginRequest(email, "Wr0ng!Pass")));
        assertEquals(HttpStatus.UNAUTHORIZED, error.getStatus());
    }

    @Test
    void codeIsRejectedAfterTooManyWrongAttempts() {
        String email = uniqueEmail();
        authService.signup(new SignupRequest(email, PASSWORD, "New User", null));
        String code = lastCode();
        String wrongCode = code.equals("000000") ? "111111" : "000000";

        for (int i = 0; i < 5; i++) {
            assertThrows(BusinessException.class, () -> emailVerificationService.verify(email, wrongCode));
        }

        BusinessException error = assertThrows(BusinessException.class, () -> emailVerificationService.verify(email, code));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, error.getStatus());
    }

    @Test
    void resendWithinCooldownIsRejected() {
        String email = uniqueEmail();
        authService.signup(new SignupRequest(email, PASSWORD, "New User", null));

        BusinessException error = assertThrows(BusinessException.class, () -> emailVerificationService.resend(email));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, error.getStatus());
    }

    @Test
    void resignupOnUnverifiedEmailReplacesPendingSignup() {
        String email = uniqueEmail();
        authService.signup(new SignupRequest(email, PASSWORD, "First Name", null));
        String firstCode = lastCode();
        expireCooldown(email);

        authService.signup(new SignupRequest(email, "An0ther!Pass", "Second Name", null));
        String secondCode = lastCode();

        UserTbl user = userRepository.findByAuthUid(email).orElseThrow();
        assertEquals("Second Name", user.getFullName());
        if (!firstCode.equals(secondCode)) {
            assertThrows(BusinessException.class, () -> emailVerificationService.verify(email, firstCode));
        }
        assertNotNull(emailVerificationService.verify(email, secondCode).accessToken());
    }

    @Test
    void verifiedEmailCannotSignUpAgain() {
        String email = uniqueEmail();
        authService.signup(new SignupRequest(email, PASSWORD, "New User", null));
        emailVerificationService.verify(email, lastCode());

        BusinessException error = assertThrows(BusinessException.class,
                () -> authService.signup(new SignupRequest(email, PASSWORD, "Someone Else", null)));
        assertEquals(HttpStatus.CONFLICT, error.getStatus());
    }

    @Test
    void multipleSignupsWithoutPhoneStoreNullPhone() {
        String first = uniqueEmail();
        String second = uniqueEmail();

        authService.signup(new SignupRequest(first, PASSWORD, "No Phone One", ""));
        authService.signup(new SignupRequest(second, PASSWORD, "No Phone Two", null));

        assertNull(userRepository.findByAuthUid(first).orElseThrow().getPhoneNumber());
        assertNull(userRepository.findByAuthUid(second).orElseThrow().getPhoneNumber());
    }

    @Test
    void accessTokenCarriesTheUsersRealRole() {
        String email = uniqueEmail();
        userRepository.save(UserTbl.builder()
                .authUid(email)
                .fullName("Admin User")
                .passwordHash(passwordEncoder.encode(PASSWORD))
                .globalRole(UserRole.ADMIN)
                .build());

        TokenBundle tokens = authService.login(new LoginRequest(email, PASSWORD));

        assertEquals("ADMIN", jwtService.parseAndValidate(tokens.accessToken()).get("role", String.class));
    }

    @Test
    void passwordlessUserCannotLogInWithAPassword() {
        String email = uniqueEmail();
        UUID userId = userFacade.createPasswordlessUser(email, "Google User").id();

        assertNull(userRepository.findById(userId).orElseThrow().getPasswordHash());
        assertTrue(userFacade.isEmailVerified(userId));
        assertThrows(BusinessException.class, () -> authService.login(new LoginRequest(email, "anything")));
    }

    @Test
    void landlordCreatedAccountsStayVerified() {
        UUID userId = userFacade.createUser(uniqueEmail(), "Tenant", null, PASSWORD).id();
        assertTrue(userFacade.isEmailVerified(userId));
        assertFalse(emailVerificationRepository.findByUserId(userId).isPresent());
    }

    private String lastCode() {
        return events.stream(EmailVerificationRequestedEvent.class)
                .reduce((first, second) -> second)
                .orElseThrow()
                .getCode();
    }

    private void expireCooldown(String email) {
        UUID userId = userRepository.findByAuthUid(email).orElseThrow().getId();
        EmailVerificationTbl verification = emailVerificationRepository.findByUserId(userId).orElseThrow();
        verification.setLastSentAt(Instant.now().minusSeconds(120));
        emailVerificationRepository.save(verification);
    }

    private static String uniqueEmail() {
        return "auth-test-" + UUID.randomUUID() + "@example.com";
    }
}
