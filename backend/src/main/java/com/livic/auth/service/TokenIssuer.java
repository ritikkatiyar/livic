package com.livic.auth.service;

import com.livic.auth.domain.RefreshTokenTbl;
import com.livic.auth.dto.AuthResponses.AuthUserSummary;
import com.livic.auth.dto.AuthResponses.TokenBundle;
import com.livic.auth.service.interfaces.RefreshTokenCrudService;
import com.livic.config.JwtProperties;
import com.livic.user.dto.UserSummaryDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

/**
 * Issues an access JWT and a persisted refresh token for an already-authenticated user.
 * Shared by password login, email verification, and external identity providers.
 */
@Service
@RequiredArgsConstructor
public class TokenIssuer {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final JwtService jwtService;
    private final RefreshTokenCrudService refreshTokenCrudService;
    private final JwtProperties jwtProperties;

    public TokenBundle issueFor(UserSummaryDTO user) {
        String accessToken = jwtService.createAccessToken(user);
        String refreshToken = createAndPersistRefreshToken(user);
        long expiresInSeconds = Math.max(1L, jwtProperties.accessExpirationMs() / 1000L);
        return new TokenBundle(
                accessToken,
                refreshToken,
                "Bearer",
                expiresInSeconds,
                new AuthUserSummary(user.id().toString(), user.authUid(), user.fullName())
        );
    }

    private String createAndPersistRefreshToken(UserSummaryDTO user) {
        byte[] raw = new byte[32];
        RANDOM.nextBytes(raw);
        String plain = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        RefreshTokenTbl entity = RefreshTokenTbl.builder()
                .userId(user.id())
                .tokenHash(TokenHasher.sha256Hex(plain))
                .expiresAt(Instant.now().plusMillis(jwtProperties.refreshExpirationMs()))
                .revoked(false)
                .build();
        refreshTokenCrudService.save(entity);
        return plain;
    }
}
