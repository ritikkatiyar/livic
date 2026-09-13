package com.livic.platform.auth.repository;

import com.livic.platform.auth.domain.EmailVerificationTbl;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EmailVerificationRepository extends JpaRepository<EmailVerificationTbl, UUID> {
    Optional<EmailVerificationTbl> findByUserId(UUID userId);
}
