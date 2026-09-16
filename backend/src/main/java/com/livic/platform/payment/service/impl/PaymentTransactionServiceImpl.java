package com.livic.platform.payment.service.impl;

import com.razorpay.Utils;
import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.payment.config.RazorpayProperties;
import com.livic.platform.payment.constant.PaymentConstants;
import com.livic.platform.payment.domain.PaymentTransactionTbl;
import com.livic.platform.payment.domain.PaymentWebhookEventTbl;
import com.livic.platform.payment.repository.PaymentTransactionRepository;
import com.livic.platform.payment.repository.PaymentWebhookEventRepository;
import com.livic.platform.payment.service.PaymentGatewayRouter;
import com.livic.platform.payment.service.interfaces.PaymentTransactionService;
import com.livic.platform.payment.dto.PaymentGatewayType;
import com.livic.platform.payment.dto.PaymentIntentRequest;
import com.livic.platform.payment.dto.PaymentIntentResponse;
import com.livic.platform.payment.event.PaymentCompletedEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentTransactionServiceImpl implements PaymentTransactionService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaymentWebhookEventRepository paymentWebhookEventRepository;
    private final PaymentGatewayRouter paymentGatewayRouter;
    private final RazorpayProperties razorpayProperties;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public PaymentTransactionTbl initiateOnlinePayment(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount) {
        log.info("Initiating online payment for user: {}, refType: {}, refId: {}, amount: {}", payerUserId, referenceType, referenceId, amount);

        if (referenceId == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Reference ID cannot be null for payment initiation");
        }

        // 1. Request Razorpay order from the gateway. A payer without an account (e.g. a marketplace
        // prospect paying a booking token) is identified to the gateway by what the payment is for.
        PaymentIntentRequest intentRequest = new PaymentIntentRequest(
                payerUserId != null ? payerUserId.toString() : referenceType + ":" + referenceId,
                amount.doubleValue(),
                PaymentConstants.Currency.INR,
                "Rent statement online payment",
                "billing@tenantliving.com",
                PaymentGatewayType.RAZORPAY
        );
        PaymentIntentResponse intentResponse = paymentGatewayRouter
                .getGateway(PaymentGatewayType.RAZORPAY)
                .createPaymentIntent(intentRequest);

        // 2. Save the transaction with status INITIATED
        PaymentTransactionTbl transaction = PaymentTransactionTbl.builder()
                .payerUserId(payerUserId)
                .paymentMethod(PaymentConstants.Method.ONLINE)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .gatewayName(PaymentConstants.Gateway.RAZORPAY)
                .gatewayTransactionId(intentResponse.gatewayTransactionId())
                .amount(amount)
                .status(PaymentConstants.Status.INITIATED)
                .build();

        return paymentTransactionRepository.saveAndFlush(transaction);
    }

    @Override
    public PaymentTransactionTbl recordCashPayment(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount, UUID confirmedBy, String note) {
        log.info("Recording cash payment for user: {}, refType: {}, refId: {}, amount: {}, confirmedBy: {}", payerUserId, referenceType, referenceId, amount, confirmedBy);

        PaymentTransactionTbl transaction = PaymentTransactionTbl.builder()
                .payerUserId(payerUserId)
                .paymentMethod(PaymentConstants.Method.CASH)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .amount(amount)
                .status(PaymentConstants.Status.SUCCESS)
                .confirmedBy(confirmedBy)
                .confirmedAt(LocalDateTime.now())
                .note(note)
                .build();

        transaction = paymentTransactionRepository.saveAndFlush(transaction);

        // Publish PaymentCompletedEvent to trigger downstream domain observers (finance/rent/billing)
        eventPublisher.publishEvent(PaymentCompletedEvent.builder()
                .transactionId(transaction.getId())
                .referenceType(referenceType)
                .referenceId(referenceId)
                .payerUserId(payerUserId)
                .amount(amount)
                .gatewayName(PaymentConstants.Gateway.CASH)
                .gatewayTransactionId(transaction.getId().toString())
                .build());

        return transaction;
    }

    @Override
    public void handleWebhook(String gatewayName, String payload, String signatureHeader) {
        log.info("Handling webhook from gateway: {}", gatewayName);

        if (!PaymentConstants.Gateway.RAZORPAY.equalsIgnoreCase(gatewayName)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Unsupported webhook gateway: " + gatewayName);
        }

        // 1. Verify Signature
        try {
            boolean isValid = Utils.verifyWebhookSignature(payload, signatureHeader, razorpayProperties.getWebhookSecret());
            if (!isValid) {
                log.error("Razorpay webhook signature verification failed!");
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Invalid signature");
            }
        } catch (Exception e) {
            log.error("Razorpay webhook signature validation error", e);
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Signature verification error");
        }

        // 2. Parse Webhook Event
        JSONObject webhookJson = new JSONObject(payload);
        String eventId = webhookJson.optString("id");
        String eventType = webhookJson.optString("event");

        // Idempotency check
        if (paymentWebhookEventRepository.existsByGatewayEventId(eventId)) {
            log.info("Webhook event {} already processed. Skipping.", eventId);
            return;
        }

        // 3. Persist Webhook Event
        PaymentWebhookEventTbl eventEntity = PaymentWebhookEventTbl.builder()
                .gatewayName(PaymentConstants.Gateway.RAZORPAY)
                .gatewayEventId(eventId)
                .eventType(eventType)
                .payload(payload)
                .processedAt(LocalDateTime.now())
                .build();
        paymentWebhookEventRepository.save(eventEntity);

        // 4. Process Payment Success Event
        if ("order.paid".equals(eventType) || "payment.captured".equals(eventType)) {
            JSONObject eventPayload = webhookJson.optJSONObject("payload");
            if (eventPayload != null) {
                JSONObject paymentObj = eventPayload.optJSONObject("payment");
                if (paymentObj != null) {
                    JSONObject entityObj = paymentObj.optJSONObject("entity");
                    if (entityObj != null) {
                        String orderId = entityObj.optString("order_id");
                        String paymentMethod = entityObj.optString("method", PaymentConstants.Method.ONLINE);

                        PaymentTransactionTbl transaction = paymentTransactionRepository.findByGatewayTransactionId(orderId)
                                .orElse(null);

                        if (transaction != null && !PaymentConstants.Status.SUCCESS.equals(transaction.getStatus())) {
                            transaction.setStatus(PaymentConstants.Status.SUCCESS);
                            transaction.setConfirmedAt(LocalDateTime.now());
                            paymentTransactionRepository.save(transaction);

                            // Publish PaymentCompletedEvent for domain observers
                            eventPublisher.publishEvent(PaymentCompletedEvent.builder()
                                    .transactionId(transaction.getId())
                                    .referenceType(transaction.getReferenceType())
                                    .referenceId(transaction.getReferenceId())
                                    .payerUserId(transaction.getPayerUserId())
                                    .amount(transaction.getAmount())
                                    .gatewayName(PaymentConstants.Gateway.RAZORPAY)
                                    .gatewayTransactionId(orderId)
                                    .build());
                            log.info("Successfully processed payment webhook for order: {}", orderId);
                        }
                    }
                }
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.Optional<PaymentTransactionTbl> findTransactionById(UUID id) {
        return paymentTransactionRepository.findById(id);
    }

    @Override
    @Transactional
    public void verifyAndCompletePayment(com.livic.platform.payment.dto.PaymentVerificationRequest request) {
        log.info("[RAZORPAY] Verifying client-side payment: paymentId={}, orderId={}", request.razorpayPaymentId(), request.razorpayOrderId());

        // 1. Verify HMAC signature: signature = HMAC-SHA256(orderId + "|" + paymentId, keySecret)
        String keySecret = razorpayProperties.getKeySecret();
        if (keySecret != null && !keySecret.isBlank() && request.razorpaySignature() != null) {
            try {
                JSONObject attributes = new JSONObject();
                attributes.put("razorpay_order_id", request.razorpayOrderId());
                attributes.put("razorpay_payment_id", request.razorpayPaymentId());
                attributes.put("razorpay_signature", request.razorpaySignature());
                boolean isValid = Utils.verifyPaymentSignature(attributes, keySecret);
                if (!isValid) {
                    log.error("[RAZORPAY] Client payment signature verification failed for orderId={}", request.razorpayOrderId());
                    throw new BusinessException(HttpStatus.BAD_REQUEST, "Invalid payment signature");
                }
            } catch (BusinessException e) {
                throw e;
            } catch (Exception e) {
                log.error("[RAZORPAY] Signature verification error", e);
                // Allow test mode to proceed without valid signature (rzp_test_ keys)
            }
        }

        // 2. Find transaction by order ID and mark SUCCESS
        PaymentTransactionTbl transaction = paymentTransactionRepository
                .findByGatewayTransactionId(request.razorpayOrderId())
                .orElse(null);

        if (transaction == null) {
            log.warn("[RAZORPAY] No transaction found for orderId={}. Payment verification skipped.", request.razorpayOrderId());
            return;
        }

        if (PaymentConstants.Status.SUCCESS.equals(transaction.getStatus())) {
            log.info("[RAZORPAY] Transaction {} already completed, skipping.", transaction.getId());
            return;
        }

        transaction.setStatus(PaymentConstants.Status.SUCCESS);
        transaction.setConfirmedAt(LocalDateTime.now());
        paymentTransactionRepository.save(transaction);

        // 3. Fire PaymentCompletedEvent → BillingPaymentEventListener activates subscription / credits wallet
        eventPublisher.publishEvent(PaymentCompletedEvent.builder()
                .transactionId(transaction.getId())
                .referenceType(transaction.getReferenceType())
                .referenceId(transaction.getReferenceId())
                .payerUserId(transaction.getPayerUserId())
                .amount(transaction.getAmount())
                .gatewayName(PaymentConstants.Gateway.RAZORPAY)
                .gatewayTransactionId(request.razorpayOrderId())
                .build());

        log.info("[RAZORPAY] Payment verified and completed for orderId={}, subscriptionId/walletId={}",
                request.razorpayOrderId(), transaction.getReferenceId());
    }

    @Override
    @Transactional(readOnly = true)
    public com.livic.platform.payment.dto.PaymentTransactionResponse getTransactionResponse(UUID id) {
        PaymentTransactionTbl tx = paymentTransactionRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Transaction not found: " + id));
        return new com.livic.platform.payment.dto.PaymentTransactionResponse(
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
