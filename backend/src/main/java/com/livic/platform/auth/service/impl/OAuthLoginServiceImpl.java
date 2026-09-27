package com.livic.platform.auth.service.impl;

import com.livic.platform.auth.repository.RefreshTokenRepository;
import com.livic.platform.auth.repository.EmailVerificationRepository;
import com.livic.platform.auth.repository.AuthIdentityRepository;
import com.livic.platform.auth.domain.AuthIdentityTbl;
import com.livic.platform.auth.dto.AuthResponses.TokenBundle;
import com.livic.platform.auth.provider.AuthProviderType;
import com.livic.platform.auth.provider.ExternalIdentityProvider;
import com.livic.platform.auth.provider.ResolvedIdentity;
import com.livic.platform.auth.service.interfaces.OAuthLoginService;
import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
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
    private final AuthIdentityRepository authIdentityRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final UserFacade userFacade;
    private final TokenIssuer tokenIssuer;
    private final RefreshTokenRepository refreshTokenRepository;

    public OAuthLoginServiceImpl(List<ExternalIdentityProvider> providers,
                                 AuthIdentityRepository authIdentityRepository,
                                 EmailVerificationRepository emailVerificationRepository,
                                 UserFacade userFacade,
                                 TokenIssuer tokenIssuer,
                                 RefreshTokenRepository refreshTokenRepository) {
        providers.forEach(provider -> this.providers.put(provider.type(), provider));
        this.authIdentityRepository = authIdentityRepository;
        this.emailVerificationRepository = emailVerificationRepository;
        this.userFacade = userFacade;
        this.tokenIssuer = tokenIssuer;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Override
    @Transactional
    public TokenBundle login(String provider, String idToken) {
        AuthProviderType type = resolveType(provider);
        ExternalIdentityProvider identityProvider = Optional.ofNullable(providers.get(type))
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "Sign-in with " + provider + " is not enabled"));

        ResolvedIdentity identity = identityProvider.verify(idToken);

        Optional<AuthIdentityTbl> linked = authIdentityRepository.findByProviderAndProviderSubject(type, identity.subject());
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
            refreshTokenRepository.revokeAllByUserId(user.id());
            log.warn("unverified_account_claimed_via_provider userId={} provider={}", user.id(), type);
        }

        // The provider has proven mailbox ownership, so any pending signup code is no longer needed.
        userFacade.markEmailVerified(user.id());
        emailVerificationRepository.findByUserId(user.id()).ifPresent(emailVerificationRepository::delete);

        authIdentityRepository.save(AuthIdentityTbl.builder()
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
