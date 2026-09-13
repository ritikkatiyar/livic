package com.livic.platform.user.service.interfaces;

import com.livic.platform.common.service.interfaces.CrudService;
import com.livic.platform.user.domain.UserPreferenceTbl;

import java.util.Optional;
import java.util.UUID;

public interface UserPreferenceCrudService extends CrudService<UserPreferenceTbl, UUID> {
    Optional<UserPreferenceTbl> findByUserId(UUID userId);
}
