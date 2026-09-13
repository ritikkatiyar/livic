package com.livic.auth.provider.google;

import com.livic.auth.provider.AuthProviderType;
import com.livic.auth.provider.ExternalIdentityProvider;
import com.livic.auth.provider.ResolvedIdentity;
import com.livic.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@Slf4j
@Component
@ConditionalOnProperty(prefix = "app.oauth.google", name = "enabled", havingValue = "true")
public class GoogleIdentityProvider implements ExternalIdentityProvider {

    private static final String JWKS_URI = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> ISSUERS = Set.of("https://accounts.google.com", "accounts.google.com");

    private final JwtDecoder decoder;

    public GoogleIdentityProvider(GoogleOAuthProperties properties) {
        NimbusJwtDecoder nimbusDecoder = NimbusJwtDecoder.withJwkSetUri(JWKS_URI).build();
        nimbusDecoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefault(),
                issuerValidator(),
                audienceValidator(properties.clientIds() != null ? properties.clientIds() : List.of())
        ));
        this.decoder = nimbusDecoder;
    }

    @Override
    public AuthProviderType type() {
        return AuthProviderType.GOOGLE;
    }

    @Override
    public ResolvedIdentity verify(String idToken) {
        Jwt jwt;
        try {
            jwt = decoder.decode(idToken);
        } catch (JwtException e) {
            log.warn("google_id_token_rejected reason={}", e.getMessage());
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Google sign-in failed. Please try again.");
        }

        String email = jwt.getClaimAsString("email");
        return new ResolvedIdentity(
                jwt.getSubject(),
                email != null ? email.trim().toLowerCase(Locale.ROOT) : null,
                // Google has emitted email_verified as both a boolean and the string "true".
                "true".equalsIgnoreCase(String.valueOf(jwt.getClaims().get("email_verified"))),
                jwt.getClaimAsString("name")
        );
    }

    private static OAuth2TokenValidator<Jwt> issuerValidator() {
        return jwt -> ISSUERS.contains(jwt.getClaimAsString("iss"))
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Unexpected issuer", null));
    }

    private static OAuth2TokenValidator<Jwt> audienceValidator(List<String> clientIds) {
        return jwt -> jwt.getAudience() != null && jwt.getAudience().stream().anyMatch(clientIds::contains)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Unexpected audience", null));
    }
}
