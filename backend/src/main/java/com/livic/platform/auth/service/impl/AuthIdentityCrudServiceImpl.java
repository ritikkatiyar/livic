package com.livic.platform.auth.service.impl;

import com.livic.platform.auth.domain.AuthIdentityTbl;
import com.livic.platform.auth.provider.AuthProviderType;
import com.livic.platform.auth.repository.AuthIdentityRepository;
import com.livic.platform.auth.service.interfaces.AuthIdentityCrudService;
import com.livic.platform.common.service.impl.AbstractCrudService;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthIdentityCrudServiceImpl extends AbstractCrudService<AuthIdentityTbl, UUID, AuthIdentityRepository> implements AuthIdentityCrudService {

    public AuthIdentityCrudServiceImpl(AuthIdentityRepository repository) {
        super(repository);
    }

    @Override
    public Optional<AuthIdentityTbl> findByProviderAndProviderSubject(AuthProviderType provider, String providerSubject) {
        return repository.findByProviderAndProviderSubject(provider, providerSubject);
    }
}
