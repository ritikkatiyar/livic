package com.livic.auth.service.impl;

import com.livic.auth.domain.AuthIdentityTbl;
import com.livic.auth.dto.AuthResponses.TokenBundle;
import com.livic.auth.provider.AuthProviderType;
import com.livic.auth.provider.ExternalIdentityProvider;
import com.livic.auth.provider.ResolvedIdentity;
import com.livic.auth.service.TokenIssuer;
import com.livic.auth.service.interfaces.AuthIdentityCrudService;
import com.livic.auth.service.interfaces.EmailVerificationCrudService;
import com.livic.auth.service.interfaces.OAuthLoginService;
import com.livic.auth.service.interfaces.RefreshTokenCrudService;
import com.livic.common.exception.BusinessException;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
public class OAuthLoginServiceImpl implements OAuthLoginService {

    private final Map<AuthProviderType, ExternalIdentityProvider> providers = new EnumMap<>(AuthProviderType.class);
    private final AuthIdentityCrudService authIdentityCrudService;
    private final EmailVerificationCrudService emailVerificationCrudService;
    private final UserFacade userFacade;
    private final TokenIssuer tokenIssuer;
    private final RefreshTokenCrudService refreshTokenCrudService;

    public OAuthLoginServiceImpl(List<ExternalIdentityProvider> providers,
                                 AuthIdentityCrudService authIdentityCrudService,
                                 EmailVerificationCrudService emailVerificationCrudService,
                                 UserFacade userFacade,
                                 TokenIssuer tokenIssuer,
                                 RefreshTokenCrudService refreshTokenCrudService) {
        providers.forEach(provider -> this.providers.put(provider.type(), provider));
        this.authIdentityCrudService = authIdentityCrudService;
        this.emailVerificationCrudService = emailVerificationCrudService;
        this.userFacade = userFacade;
        this.tokenIssuer = tokenIssuer;
        this.refreshTokenCrudService = refreshTokenCrudService;
    }

    @Override
    @Transactional
    public TokenBundle login(String provider, String idToken) {
        AuthProviderType type = resolveType(provider);
        ExternalIdentityProvider identityProvider = Optional.ofNullable(providers.get(type))
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "Sign-in with " + provider + " is not enabled"));

        ResolvedIdentity identity = identityProvider.verify(idToken);

        Optional<AuthIdentityTbl> linked = authIdentityCrudService.findByProviderAndProviderSubject(type, identity.subject());
        if (linked.isPresent()) {
            UserSummaryDTO user = userFacade.getUserById(linked.get().getUserId())
                    .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "Account no longer available"));
            return tokenIssuer.issueFor(user);
        }

        if (!identity.emailVerified() || identity.email() == null || identity.email().isBlank()) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Your " + provider + " email address is not verified");
        }

        UserSummaryDTO user = userFacade.getUserByEmail(identity.email())
                .orElseGet(() -> userFacade.createPasswordlessUser(identity.email(), displayName(identity)));

        if (!userFacade.isEmailVerified(user.id())) {
            // An unverified account may have been registered by someone who does not own this mailbox.
            // Drop any password and sessions created before ownership was proven, so they cannot be reused.
            userFacade.clearPassword(user.id());
            refreshTokenCrudService.revokeAllForUser(user.id());
            log.warn("unverified_account_claimed_via_provider userId={} provider={}", user.id(), type);
        }

        // The provider has proven mailbox ownership, so any pending signup code is no longer needed.
        userFacade.markEmailVerified(user.id());
        emailVerificationCrudService.findByUserId(user.id()).ifPresent(emailVerificationCrudService::delete);

        authIdentityCrudService.save(AuthIdentityTbl.builder()
                .userId(user.id())
                .provider(type)
                .providerSubject(identity.subject())
                .build());
        log.info("external_identity_linked userId={} provider={}", user.id(), type);

        return tokenIssuer.issueFor(user);
    }

    private static AuthProviderType resolveType(String provider) {
        try {
            return AuthProviderType.valueOf(provider.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Unsupported sign-in provider");
        }
    }

    private static String displayName(ResolvedIdentity identity) {
        if (identity.fullName() != null && !identity.fullName().isBlank()) {
            return identity.fullName();
        }
        return identity.email().substring(0, identity.email().indexOf('@'));
    }
}
