package com.livic.platform.auth.service.interfaces;

import com.livic.platform.auth.dto.AuthResponses.TokenBundle;

import java.time.Duration;
import java.util.UUID;

public interface EmailVerificationService {

    Duration CODE_TTL = Duration.ofMinutes(10);
    Duration RESEND_COOLDOWN = Duration.ofSeconds(60);

    /** Creates or replaces the user's verification code and emails it. Rejects requests inside the resend cooldown. */
    void issueCode(UUID userId);

    TokenBundle verify(String email, String code);

    /** Re-sends a code for a pending signup. Silently does nothing for unknown or already-verified emails. */
    void resend(String email);
}
