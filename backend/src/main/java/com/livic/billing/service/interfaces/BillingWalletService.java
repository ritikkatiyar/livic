package com.livic.billing.service.interfaces;

import com.livic.billing.domain.BillingWalletTbl;
import com.livic.billing.domain.SaasSubscriptionTbl;
import com.livic.billing.dto.BillingStatusResponse;
import com.livic.payment.dto.PaymentIntentRequest;
import com.livic.payment.dto.PaymentIntentResponse;
import com.livic.payment.dto.SubscriptionRequest;
import com.livic.payment.dto.PaymentInitiationResponse;

import java.util.UUID;

public interface BillingWalletService {

    boolean hasBalance(UUID userId, double requiredCredits);

    void debitWallet(UUID userId, double requiredCredits, String reason);

    void creditWallet(UUID userId, double credits, String reason, String referenceId);

    double getRemainingBalance(UUID userId);

    BillingWalletTbl getOrCreateWallet(UUID userId);

    SaasSubscriptionTbl getActiveSubscription(UUID userId);

    BillingStatusResponse getBillingStatus(UUID userId);

    PaymentIntentResponse topUpWallet(UUID userId, String username, PaymentIntentRequest request);

    PaymentInitiationResponse subscribeToPlan(UUID userId, SubscriptionRequest request);
}
