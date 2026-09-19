package com.livic.platform.payment;

import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.payment.config.RazorpayProperties;
import com.livic.platform.payment.dto.PaymentVerificationRequest;
import com.livic.platform.payment.repository.PaymentTransactionRepository;
import com.livic.platform.payment.repository.PaymentWebhookEventRepository;
import com.livic.platform.payment.service.PaymentGatewayRouter;
import com.livic.platform.payment.service.impl.PaymentTransactionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PaymentVerificationFailsClosedTest {

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;
    @Mock
    private PaymentWebhookEventRepository paymentWebhookEventRepository;
    @Mock
    private PaymentGatewayRouter paymentGatewayRouter;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    private RazorpayProperties razorpayProperties;
    private PaymentTransactionServiceImpl service;

    @BeforeEach
    void setUp() {
        razorpayProperties = new RazorpayProperties();
        razorpayProperties.setKeyId("rzp_test_key");
        razorpayProperties.setKeySecret("a-secret");
        service = new PaymentTransactionServiceImpl(
                paymentTransactionRepository,
                paymentWebhookEventRepository,
                paymentGatewayRouter,
                razorpayProperties,
                eventPublisher);
    }

    @Test
    @DisplayName("A verification request with no signature is rejected and completes nothing")
    void missingSignatureIsRejected() {
        PaymentVerificationRequest request = new PaymentVerificationRequest("pay_1", "order_1", null);

        assertThatThrownBy(() -> service.verifyAndCompletePayment(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Invalid payment signature");

        verifyNoInteractions(paymentTransactionRepository);
        verify(eventPublisher, never()).publishEvent(org.mockito.ArgumentMatchers.any());
    }

    @Test
    @DisplayName("A blank signature is rejected too")
    void blankSignatureIsRejected() {
        PaymentVerificationRequest request = new PaymentVerificationRequest("pay_1", "order_1", "   ");

        assertThatThrownBy(() -> service.verifyAndCompletePayment(request))
                .isInstanceOf(BusinessException.class);

        verifyNoInteractions(paymentTransactionRepository);
    }

    @Test
    @DisplayName("A signature that does not verify is rejected, so the transaction is never marked SUCCESS")
    void forgedSignatureIsRejected() {
        PaymentVerificationRequest request = new PaymentVerificationRequest("pay_1", "order_1", "not-a-real-signature");

        assertThatThrownBy(() -> service.verifyAndCompletePayment(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Invalid payment signature");

        verifyNoInteractions(paymentTransactionRepository);
        verify(eventPublisher, never()).publishEvent(org.mockito.ArgumentMatchers.any());
    }

    @Test
    @DisplayName("With no key secret configured, verification is unavailable rather than assumed valid")
    void missingKeySecretIsUnavailable() {
        razorpayProperties.setKeySecret("  ");
        PaymentVerificationRequest request = new PaymentVerificationRequest("pay_1", "order_1", "some-signature");

        BusinessException thrown = (BusinessException) org.assertj.core.api.Assertions
                .catchThrowable(() -> service.verifyAndCompletePayment(request));

        assertThat(thrown).isNotNull();
        assertThat(thrown.getStatus()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        verifyNoInteractions(paymentTransactionRepository);
    }
}
