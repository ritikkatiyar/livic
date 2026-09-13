package com.livic.platform.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Validates access JWTs (HS256). Verification only: tokens are issued by the auth module.
 */
@Component
@RequiredArgsConstructor
public class JwtVerifier {

    private final JwtProperties jwtProperties;

    public Claims verify(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(signingKey(jwtProperties))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** Shared with the token issuer while tokens are signed with a symmetric key. */
    public static SecretKey signingKey(JwtProperties jwtProperties) {
        byte[] keyBytes = jwtProperties.secret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
