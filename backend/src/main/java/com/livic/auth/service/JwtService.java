package com.livic.auth.service;

import com.livic.config.JwtProperties;
import com.livic.user.dto.UserSummaryDTO;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Issues and validates access JWTs (HS256). Used by {@link AuthService} and {@link com.livic.auth.security.JwtAuthenticationFilter}.
 */
@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtProperties jwtProperties;

    public String createAccessToken(UserSummaryDTO user) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + jwtProperties.accessExpirationMs());
        return Jwts.builder()
                .subject(user.id().toString())
                .claim("email", user.authUid())
                .claim("role", user.globalRole() != null ? user.globalRole().name() : "USER")
                .issuedAt(now)
                .expiration(exp)
                .signWith(signingKey())
                .compact();
    }

    public Claims parseAndValidate(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey signingKey() {
        byte[] keyBytes = jwtProperties.secret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
