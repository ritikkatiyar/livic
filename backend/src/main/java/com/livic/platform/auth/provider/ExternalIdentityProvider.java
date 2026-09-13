package com.livic.platform.auth.provider;

/**
 * Verifies a credential issued by an external identity provider (Google, Apple, ...).
 * Implementations must not read or write Livic user state; linking happens in OAuthLoginService.
 */
public interface ExternalIdentityProvider {

    AuthProviderType type();

    /** Throws a 401 BusinessException when the token is invalid, expired, or issued for another app. */
    ResolvedIdentity verify(String idToken);
}
