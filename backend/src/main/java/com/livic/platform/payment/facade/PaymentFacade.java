package com.livic.platform.payment.facade;

import com.livic.platform.payment.dto.PaymentInitiationRequest;
import com.livic.platform.payment.dto.PaymentInitiationResponse;
import com.livic.platform.payment.dto.PaymentTransactionResponse;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface PaymentFacade {

    PaymentInitiationResponse initiateOnlinePayment(PaymentInitiationRequest request);

    PaymentInitiationResponse recordCashPayment(PaymentInitiationRequest request);

    Optional<PaymentInitiationResponse> getTransactionStatus(UUID transactionId);

    /**
     * The latest successful transaction against a reference. Bills no longer carry a single
     * transaction id: a part-paid bill has several, and the link lives on the payment side.
     */
    Optional<PaymentInitiationResponse> getLatestSuccessfulTransaction(String referenceType, UUID referenceId);

    PaymentTransactionResponse initiateOnlinePaymentTransaction(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount);

    PaymentTransactionResponse recordCashPaymentTransaction(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount, UUID confirmedBy, String note);
}
