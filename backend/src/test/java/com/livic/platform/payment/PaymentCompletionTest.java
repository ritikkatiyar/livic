package com.livic.platform.payment;

import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.payment.config.RazorpayProperties;
import com.livic.platform.payment.constant.PaymentConstants;
import com.livic.platform.payment.domain.PaymentTransactionTbl;
import com.livic.platform.payment.dto.PaymentVerificationRequest;
import com.livic.platform.payment.event.PaymentCompletedEvent;
import com.livic.platform.payment.repository.PaymentTransactionRepository;
import com.livic.platform.payment.repository.PaymentWebhookEventRepository;
import com.livic.platform.payment.service.impl.PaymentGatewayRouter;
import com.livic.platform.payment.service.impl.PaymentTransactionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import com.livic.platform.outbox.facade.OutboxFacade;
import org.springframework.http.HttpStatus;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The client's verify call and Razorpay's two webhooks (payment.captured, order.paid) usually
 * arrive together for one payment. Completion reads the transaction through a row lock, so only
 * the first of them marks it SUCCESS and publishes PaymentCompletedEvent.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PaymentCompletionTest {

    private static final String KEY_SECRET = "a-secret";
    private static final String WEBHOOK_SECRET = "webhook-secret";
    private static final String ORDER_ID = "order_1";

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;
    @Mock
    private PaymentWebhookEventRepository paymentWebhookEventRepository;
    @Mock
    private PaymentGatewayRouter paymentGatewayRouter;
    @Mock
    private OutboxFacade outboxFacade;

    private PaymentTransactionServiceImpl service;

    @BeforeEach
    void setUp() {
        RazorpayProperties razorpayProperties = new RazorpayProperties();
        razorpayProperties.setKeyId("rzp_test_key");
        razorpayProperties.setKeySecret(KEY_SECRET);
        razorpayProperties.setWebhookSecret(WEBHOOK_SECRET);
        service = new PaymentTransactionServiceImpl(
                paymentTransactionRepository,
                paymentWebhookEventRepository,
                paymentGatewayRouter,
                razorpayProperties,
                outboxFacade);
    }

    @Test
    @DisplayName("Client verification completes the payment through the locked row and publishes once")
    void verificationCompletesThroughLockedRow() {
        PaymentTransactionTbl transaction = transaction("INITIATED", UUID.randomUUID());
        when(paymentTransactionRepository.findByGatewayTransactionIdForUpdate(ORDER_ID)).thenReturn(Optional.of(transaction));

        service.verifyAndCompletePayment(verification());

        assertThat(transaction.getStatus()).isEqualTo(PaymentConstants.Status.SUCCESS);
        verify(outboxFacade, times(1)).publish(any(PaymentCompletedEvent.class));
        verify(paymentTransactionRepository, never()).findByGatewayTransactionId(anyString());
    }

    @Test
    @DisplayName("A webhook completes the payment through the locked row too")
    void webhookCompletesThroughLockedRow() {
        PaymentTransactionTbl transaction = transaction("INITIATED", UUID.randomUUID());
        when(paymentTransactionRepository.findByGatewayTransactionIdForUpdate(ORDER_ID)).thenReturn(Optional.of(transaction));

        String payload = webhookPayload("evt_1", "payment.captured");
        service.handleWebhook("razorpay", payload, hmac(payload, WEBHOOK_SECRET));

        assertThat(transaction.getStatus()).isEqualTo(PaymentConstants.Status.SUCCESS);
        verify(outboxFacade, times(1)).publish(any(PaymentCompletedEvent.class));
        verify(paymentTransactionRepository, never()).findByGatewayTransactionId(anyString());
    }

    @Test
    @DisplayName("Whoever gets the lock after the payment completed publishes nothing")
    void laterArrivalsCompleteNothing() {
        when(paymentTransactionRepository.findByGatewayTransactionIdForUpdate(ORDER_ID))
                .thenReturn(Optional.of(transaction(PaymentConstants.Status.SUCCESS, UUID.randomUUID())));

        service.verifyAndCompletePayment(verification());
        String payload = webhookPayload("evt_2", "order.paid");
        service.handleWebhook("razorpay", payload, hmac(payload, WEBHOOK_SECRET));

        verify(outboxFacade, never()).publish(any(PaymentCompletedEvent.class));
    }

    @Test
    @DisplayName("Only the payer can read a transaction; anyone else is told it does not exist")
    void onlyThePayerCanReadATransaction() {
        UUID payerId = UUID.randomUUID();
        PaymentTransactionTbl transaction = transaction(PaymentConstants.Status.SUCCESS, payerId);
        when(paymentTransactionRepository.findById(transaction.getId())).thenReturn(Optional.of(transaction));

        assertThat(service.getTransactionResponse(transaction.getId(), payerId).id()).isEqualTo(transaction.getId());
        assertThatThrownBy(() -> service.getTransactionResponse(transaction.getId(), UUID.randomUUID()))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    private static PaymentTransactionTbl transaction(String status, UUID payerId) {
        PaymentTransactionTbl transaction = PaymentTransactionTbl.builder()
                .payerUserId(payerId)
                .referenceType("BILL")
                .referenceId(UUID.randomUUID())
                .gatewayTransactionId(ORDER_ID)
                .amount(new BigDecimal("1000.00"))
                .status(status)
                .build();
        transaction.setId(UUID.randomUUID());
        return transaction;
    }

    private static PaymentVerificationRequest verification() {
        return new PaymentVerificationRequest("pay_1", ORDER_ID, hmac(ORDER_ID + "|pay_1", KEY_SECRET));
    }

    private static String webhookPayload(String eventId, String eventType) {
        return "{\"id\":\"" + eventId + "\",\"event\":\"" + eventType + "\","
                + "\"payload\":{\"payment\":{\"entity\":{\"order_id\":\"" + ORDER_ID + "\",\"method\":\"upi\"}}}}";
    }

    /** Razorpay signs with HMAC-SHA256 and sends the digest as lowercase hex. */
    private static String hmac(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(e);
        }
    }
}
