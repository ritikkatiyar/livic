package com.livic.payment.service;

import com.livic.payment.dto.PaymentGatewayType;
import com.livic.payment.dto.PaymentIntentRequest;
import com.livic.payment.dto.PaymentIntentResponse;
import com.livic.payment.dto.SubscriptionRequest;
import com.livic.payment.dto.SubscriptionResponse;

public interface PaymentGatewayService {
    
    /**
     * Identifies which gateway implementation this service handles (Razorpay, etc.)
     */
    PaymentGatewayType getSupportedGateway();

    /**
     * Initializes a standard single charge or top-up (e.g., buying AI credits).
     */
    PaymentIntentResponse createPaymentIntent(PaymentIntentRequest request);

    /**
     * Initializes a recurring SaaS subscription.
     */
    SubscriptionResponse createSubscription(SubscriptionRequest request);

    /**
     * Cancels an active recurring SaaS subscription.
     */
    boolean cancelSubscription(String gatewaySubscriptionId);
}
