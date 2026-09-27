package com.livic.platform.payment.repository;

import com.livic.platform.payment.domain.PaymentTransactionTbl;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransactionTbl, UUID> {
    Optional<PaymentTransactionTbl> findByGatewayTransactionId(String gatewayTransactionId);

    /**
     * Locks the row until the caller's transaction ends. Completing a payment reads it this way,
     * so the client verify call and Razorpay's webhooks, which usually arrive together, take
     * turns: the first marks it SUCCESS and the rest see that and stop.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM PaymentTransactionTbl t WHERE t.gatewayTransactionId = :gatewayTransactionId")
    Optional<PaymentTransactionTbl> findByGatewayTransactionIdForUpdate(@Param("gatewayTransactionId") String gatewayTransactionId);

    /** Most recent transaction against a reference; a bill may have several part payments. */
    Optional<PaymentTransactionTbl> findFirstByReferenceTypeAndReferenceIdAndStatusOrderByCreatedAtDesc(
            String referenceType, UUID referenceId, String status);
}
