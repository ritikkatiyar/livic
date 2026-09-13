package com.livic.platform.auth.service;

import com.livic.platform.security.JwtProperties;
import com.livic.platform.security.JwtVerifier;
import com.livic.platform.user.dto.UserSummaryDTO;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;

/**
 * Issues access JWTs (HS256). Validation lives in {@link JwtVerifier} in the security kernel.
 */
@Service
@RequiredArgsConstructor
public class JwtService {

    private final JwtProperties jwtProperties;
    private final JwtVerifier jwtVerifier;

    public String createAccessToken(UserSummaryDTO user) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + jwtProperties.accessExpirationMs());
        return Jwts.builder()
                .subject(user.id().toString())
                .claim("email", user.authUid())
                .claim("role", user.globalRole() != null ? user.globalRole().name() : "USER")
                .issuedAt(now)
                .expiration(exp)
                .signWith(JwtVerifier.signingKey(jwtProperties))
                .compact();
    }

    public Claims parseAndValidate(String token) throws JwtException {
        return jwtVerifier.verify(token);
    }
}
