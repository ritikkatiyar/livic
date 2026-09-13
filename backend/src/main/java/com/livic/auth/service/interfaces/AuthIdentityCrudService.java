package com.livic.auth.service.interfaces;

import com.livic.auth.domain.AuthIdentityTbl;
import com.livic.auth.provider.AuthProviderType;
import com.livic.common.service.interfaces.CrudService;

import java.util.Optional;
import java.util.UUID;

public interface AuthIdentityCrudService extends CrudService<AuthIdentityTbl, UUID> {
    Optional<AuthIdentityTbl> findByProviderAndProviderSubject(AuthProviderType provider, String providerSubject);
}
