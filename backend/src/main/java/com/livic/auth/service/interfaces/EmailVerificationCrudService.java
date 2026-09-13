package com.livic.auth.service.interfaces;

import com.livic.auth.domain.EmailVerificationTbl;
import com.livic.common.service.interfaces.CrudService;

import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationCrudService extends CrudService<EmailVerificationTbl, UUID> {
    Optional<EmailVerificationTbl> findByUserId(UUID userId);
}
