package com.livic.auth.service.impl;

import com.livic.auth.domain.EmailVerificationTbl;
import com.livic.auth.repository.EmailVerificationRepository;
import com.livic.auth.service.interfaces.EmailVerificationCrudService;
import com.livic.common.service.impl.AbstractCrudService;
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
