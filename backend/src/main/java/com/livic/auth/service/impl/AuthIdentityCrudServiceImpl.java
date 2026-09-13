package com.livic.auth.service.impl;

import com.livic.auth.domain.AuthIdentityTbl;
import com.livic.auth.provider.AuthProviderType;
import com.livic.auth.repository.AuthIdentityRepository;
import com.livic.auth.service.interfaces.AuthIdentityCrudService;
import com.livic.common.service.impl.AbstractCrudService;
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
