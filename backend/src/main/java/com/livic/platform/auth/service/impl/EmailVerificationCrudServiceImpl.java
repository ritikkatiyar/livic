package com.livic.platform.auth.service.impl;

import com.livic.platform.auth.domain.EmailVerificationTbl;
import com.livic.platform.auth.repository.EmailVerificationRepository;
import com.livic.platform.auth.service.interfaces.EmailVerificationCrudService;
import com.livic.platform.common.service.impl.AbstractCrudService;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class EmailVerificationCrudServiceImpl extends AbstractCrudService<EmailVerificationTbl, UUID, EmailVerificationRepository> implements EmailVerificationCrudService {

    public EmailVerificationCrudServiceImpl(EmailVerificationRepository repository) {
        super(repository);
    }

    @Override
    public Optional<EmailVerificationTbl> findByUserId(UUID userId) {
        return repository.findByUserId(userId);
    }
}
