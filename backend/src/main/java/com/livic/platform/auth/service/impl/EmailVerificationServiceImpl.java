package com.livic.platform.auth.service.impl;

import com.livic.platform.auth.domain.EmailVerificationTbl;
import com.livic.platform.auth.dto.AuthResponses.TokenBundle;
import com.livic.platform.auth.service.TokenIssuer;
import com.livic.platform.auth.service.interfaces.EmailVerificationCrudService;
import com.livic.platform.auth.service.interfaces.EmailVerificationService;
import com.livic.platform.common.event.EmailVerificationRequestedEvent;
import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerificationServiceImpl implements EmailVerificationService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int MAX_ATTEMPTS = 5;
    private static final String INVALID_CODE = "Invalid or expired verification code";

    private final EmailVerificationCrudService emailVerificationCrudService;
    private final UserFacade userFacade;
    private final PasswordEncoder passwordEncoder;
    private final TokenIssuer tokenIssuer;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public void issueCode(UUID userId) {
        Instant now = Instant.now();
        EmailVerificationTbl verification = emailVerificationCrudService.findByUserId(userId)
                .orElseGet(() -> EmailVerificationTbl.builder().userId(userId).build());

        if (verification.getLastSentAt() != null && verification.getLastSentAt().plus(RESEND_COOLDOWN).isAfter(now)) {
            throw new BusinessException(HttpStatus.TOO_MANY_REQUESTS, "Please wait a minute before requesting another code");
        }

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        verification.setCodeHash(passwordEncoder.encode(code));
        verification.setExpiresAt(now.plus(CODE_TTL));
        verification.setAttemptCount(0);
        verification.setLastSentAt(now);
        emailVerificationCrudService.save(verification);

        eventPublisher.publishEvent(new EmailVerificationRequestedEvent(this, userId.toString(), code, CODE_TTL.toMinutes()));
        log.info("email_verification_code_issued userId={}", userId);
    }

    @Override
    @Transactional(noRollbackFor = BusinessException.class)
    public TokenBundle verify(String email, String code) {
        UserSummaryDTO user = userFacade.getUserByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new BusinessException(INVALID_CODE));
        EmailVerificationTbl verification = emailVerificationCrudService.findByUserId(user.id())
                .orElseThrow(() -> new BusinessException(INVALID_CODE));

        if (verification.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException("Verification code has expired. Request a new one.");
        }
        if (verification.getAttemptCount() >= MAX_ATTEMPTS) {
            throw new BusinessException(HttpStatus.TOO_MANY_REQUESTS, "Too many attempts. Request a new code.");
        }
        if (!passwordEncoder.matches(code, verification.getCodeHash())) {
            verification.setAttemptCount(verification.getAttemptCount() + 1);
            emailVerificationCrudService.save(verification);
            throw new BusinessException(INVALID_CODE);
        }

        userFacade.markEmailVerified(user.id());
        emailVerificationCrudService.delete(verification);
        log.info("email_verified userId={}", user.id());
        return tokenIssuer.issueFor(user);
    }

    @Override
    @Transactional
    public void resend(String email) {
        userFacade.getUserByEmail(email.trim().toLowerCase())
                .filter(user -> !userFacade.isEmailVerified(user.id()))
                .ifPresent(user -> issueCode(user.id()));
    }
}
