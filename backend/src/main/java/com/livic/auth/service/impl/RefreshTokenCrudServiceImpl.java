package com.livic.auth.service.impl;

import com.livic.auth.domain.RefreshTokenTbl;
import com.livic.auth.repository.RefreshTokenRepository;
import com.livic.auth.service.interfaces.RefreshTokenCrudService;
import com.livic.common.service.impl.AbstractCrudService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenCrudServiceImpl extends AbstractCrudService<RefreshTokenTbl, UUID, RefreshTokenRepository> implements RefreshTokenCrudService {

    public RefreshTokenCrudServiceImpl(RefreshTokenRepository repository) {
        super(repository);
    }

    @Override
    public Optional<RefreshTokenTbl> findByTokenHashAndRevokedIsFalse(String tokenHash) {
        return repository.findByTokenHashAndRevokedIsFalse(tokenHash);
    }

    @Override
    @Transactional
    public int revokeAllForUser(UUID userId) {
        return repository.revokeAllByUserId(userId);
    }
}
