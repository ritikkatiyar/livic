package com.livic.features.marketplace.repository;

import com.livic.features.marketplace.domain.OtpVerificationTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerificationTbl, UUID> {

    List<OtpVerificationTbl> findByPhoneAndCreatedAtAfter(String phone, Instant since);

    Optional<OtpVerificationTbl> findTopByPhoneOrderByCreatedAtDesc(String phone);

    Optional<OtpVerificationTbl> findBySessionToken(String sessionToken);

    void deleteByExpiresAtBefore(Instant threshold);
}
