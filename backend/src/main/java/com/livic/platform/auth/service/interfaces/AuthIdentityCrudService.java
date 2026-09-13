package com.livic.platform.auth.service.interfaces;

import com.livic.platform.auth.domain.AuthIdentityTbl;
import com.livic.platform.auth.provider.AuthProviderType;
import com.livic.platform.common.service.interfaces.CrudService;

import java.util.Optional;
import java.util.UUID;

public interface AuthIdentityCrudService extends CrudService<AuthIdentityTbl, UUID> {
    Optional<AuthIdentityTbl> findByProviderAndProviderSubject(AuthProviderType provider, String providerSubject);
}
