package com.livic.platform.payment.service.interfaces;

import com.livic.platform.payment.domain.PaymentTransactionTbl;
import com.livic.platform.payment.dto.PaymentVerificationRequest;
import java.math.BigDecimal;
import java.util.UUID;

public interface PaymentTransactionService {

    PaymentTransactionTbl initiateOnlinePayment(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount);

    PaymentTransactionTbl recordCashPayment(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount, UUID confirmedBy, String note);

    void handleWebhook(String gatewayName, String payload, String signatureHeader);

    java.util.Optional<PaymentTransactionTbl> findTransactionById(UUID id);

    com.livic.platform.payment.dto.PaymentTransactionResponse getTransactionResponse(UUID id);

    void verifyAndCompletePayment(PaymentVerificationRequest request);
}
