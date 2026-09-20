package com.livic.platform.payment.repository;

import com.livic.platform.payment.domain.PaymentTransactionTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransactionTbl, UUID> {
    Optional<PaymentTransactionTbl> findByGatewayTransactionId(String gatewayTransactionId);

    /** Most recent transaction against a reference; a bill may have several part payments. */
    Optional<PaymentTransactionTbl> findFirstByReferenceTypeAndReferenceIdAndStatusOrderByCreatedAtDesc(
            String referenceType, UUID referenceId, String status);
}
