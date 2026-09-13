package com.livic.auth.service.interfaces;

import com.livic.auth.domain.RefreshTokenTbl;
import com.livic.common.service.interfaces.CrudService;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenCrudService extends CrudService<RefreshTokenTbl, UUID> {
    Optional<RefreshTokenTbl> findByTokenHashAndRevokedIsFalse(String tokenHash);

    int revokeAllForUser(UUID userId);
}
