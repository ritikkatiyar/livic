package com.livic.platform.payment.facade.impl;

import com.livic.platform.payment.domain.PaymentTransactionTbl;
import com.livic.platform.payment.dto.PaymentInitiationRequest;
import com.livic.platform.payment.dto.PaymentInitiationResponse;
import com.livic.platform.payment.dto.PaymentTransactionResponse;
import com.livic.platform.payment.facade.PaymentFacade;
import com.livic.platform.payment.service.interfaces.PaymentTransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentFacadeImpl implements PaymentFacade {

    private final PaymentTransactionService paymentTransactionService;

    @Override
    public PaymentInitiationResponse initiateOnlinePayment(PaymentInitiationRequest request) {
        log.info("[PAYMENT FACADE] Initiating online payment: {}", request);
        PaymentTransactionTbl transaction = paymentTransactionService.initiateOnlinePayment(
                request.getPayerUserId(),
                request.getReferenceType(),
                request.getReferenceId(),
                request.getAmount()
        );

        return toResponse(transaction);
    }

    @Override
    public PaymentInitiationResponse recordCashPayment(PaymentInitiationRequest request) {
        log.info("[PAYMENT FACADE] Recording cash payment: {}", request);
        PaymentTransactionTbl transaction = paymentTransactionService.recordCashPayment(
                request.getPayerUserId(),
                request.getReferenceType(),
                request.getReferenceId(),
                request.getAmount(),
                request.getConfirmedBy(),
                request.getNote()
        );

        return toResponse(transaction);
    }

    @Override
    public Optional<PaymentInitiationResponse> getTransactionStatus(UUID transactionId) {
        return paymentTransactionService.findTransactionById(transactionId)
                .map(this::toResponse);
    }

    @Override
    public PaymentTransactionResponse initiateOnlinePaymentTransaction(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount) {
        PaymentTransactionTbl tx = paymentTransactionService.initiateOnlinePayment(payerUserId, referenceType, referenceId, amount);
        return toTransactionResponse(tx);
    }

    @Override
    public PaymentTransactionResponse recordCashPaymentTransaction(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount, UUID confirmedBy, String note) {
        PaymentTransactionTbl tx = paymentTransactionService.recordCashPayment(payerUserId, referenceType, referenceId, amount, confirmedBy, note);
        return toTransactionResponse(tx);
    }

    private PaymentInitiationResponse toResponse(PaymentTransactionTbl tx) {
        return PaymentInitiationResponse.builder()
                .transactionId(tx.getId())
                .gatewayName(tx.getGatewayName())
                .gatewayTransactionId(tx.getGatewayTransactionId())
                .amount(tx.getAmount())
                .currency("INR")
                .status(tx.getStatus())
                .paymentMethod(tx.getPaymentMethod())
                .createdAt(tx.getCreatedAt())
                .build();
    }

    private PaymentTransactionResponse toTransactionResponse(PaymentTransactionTbl tx) {
        return new PaymentTransactionResponse(
                tx.getId(),
                tx.getPayerUserId(),
                tx.getPaymentMethod(),
                tx.getReferenceType(),
                tx.getReferenceId(),
                tx.getGatewayName(),
                tx.getGatewayTransactionId(),
                tx.getAmount(),
                tx.getStatus(),
                tx.getConfirmedBy(),
                tx.getConfirmedAt(),
                tx.getNote(),
                tx.getCreatedAt(),
                tx.getUpdatedAt()
        );
    }
}
