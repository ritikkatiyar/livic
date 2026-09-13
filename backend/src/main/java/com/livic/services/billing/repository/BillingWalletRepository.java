package com.livic.services.billing.repository;

import com.livic.services.billing.domain.BillingWalletTbl;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BillingWalletRepository extends JpaRepository<BillingWalletTbl, UUID> {
    Optional<BillingWalletTbl> findByUserId(UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM BillingWalletTbl w WHERE w.userId = :userId")
    Optional<BillingWalletTbl> findByUserIdForUpdate(@Param("userId") UUID userId);
}
