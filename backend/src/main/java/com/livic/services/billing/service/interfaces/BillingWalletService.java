package com.livic.services.billing.service.interfaces;

import com.livic.services.billing.domain.BillingWalletTbl;
import com.livic.services.billing.domain.SaasSubscriptionTbl;
import com.livic.services.billing.dto.BillingStatusResponse;
import com.livic.platform.payment.dto.PaymentIntentRequest;
import com.livic.platform.payment.dto.PaymentIntentResponse;
import com.livic.platform.payment.dto.SubscriptionRequest;
import com.livic.platform.payment.dto.PaymentInitiationResponse;

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
