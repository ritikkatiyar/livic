package com.livic.platform.payment.repository;

import com.livic.platform.payment.domain.PaymentTransactionTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransactionTbl, UUID> {
    Optional<PaymentTransactionTbl> findByGatewayTransactionId(String gatewayTransactionId);
}
