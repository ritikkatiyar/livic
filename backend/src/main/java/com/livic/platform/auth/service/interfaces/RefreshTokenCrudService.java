package com.livic.platform.auth.service.interfaces;

import com.livic.platform.auth.domain.RefreshTokenTbl;
import com.livic.platform.common.service.interfaces.CrudService;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenCrudService extends CrudService<RefreshTokenTbl, UUID> {
    Optional<RefreshTokenTbl> findByTokenHashAndRevokedIsFalse(String tokenHash);

    int revokeAllForUser(UUID userId);
}
