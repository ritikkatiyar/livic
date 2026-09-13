package com.livic.platform.auth.service.interfaces;

import com.livic.platform.auth.domain.EmailVerificationTbl;
import com.livic.platform.common.service.interfaces.CrudService;

import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationCrudService extends CrudService<EmailVerificationTbl, UUID> {
    Optional<EmailVerificationTbl> findByUserId(UUID userId);
}
