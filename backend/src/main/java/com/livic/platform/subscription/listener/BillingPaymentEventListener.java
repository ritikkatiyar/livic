package com.livic.platform.subscription.listener;

import com.livic.platform.outbox.spi.OutboxConsumer;
import com.livic.platform.subscription.repository.SaasSubscriptionRepository;
import com.livic.platform.subscription.repository.BillingWalletRepository;
import com.livic.platform.subscription.constant.BillingConstants;
import com.livic.platform.subscription.domain.BillingWalletTbl;
import com.livic.platform.subscription.domain.SaasSubscriptionTbl;
import com.livic.platform.subscription.service.interfaces.BillingWalletService;
import com.livic.platform.payment.event.PaymentCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
/** Activates a subscription or credits a wallet once its payment is committed. */
public class BillingPaymentEventListener implements OutboxConsumer<PaymentCompletedEvent> {

    private final SaasSubscriptionRepository saasSubscriptionRepository;
    private final BillingWalletRepository billingWalletRepository;
    private final BillingWalletService walletService;

    /** What subscription calls its payments; payment hands them back untouched. */
    public static final String SUBSCRIPTION_REFERENCE_TYPE = "SAAS_SUBSCRIPTION";
    public static final String WALLET_TOPUP_REFERENCE_TYPE = "WALLET_TOPUP";

    @Override
    public String name() {
        return "subscription.payment";
    }

    @Override
    public Class<PaymentCompletedEvent> eventType() {
        return PaymentCompletedEvent.class;
    }

    @Override
    public boolean accepts(PaymentCompletedEvent event) {
        return SUBSCRIPTION_REFERENCE_TYPE.equalsIgnoreCase(event.referenceType())
                || WALLET_TOPUP_REFERENCE_TYPE.equalsIgnoreCase(event.referenceType());
    }

    @Override
    public void handle(PaymentCompletedEvent event) {
        if (SUBSCRIPTION_REFERENCE_TYPE.equalsIgnoreCase(event.referenceType())) {
            handleSubscriptionPayment(event);
        } else if (WALLET_TOPUP_REFERENCE_TYPE.equalsIgnoreCase(event.referenceType())) {
            handleWalletTopUpPayment(event);
        }
    }

    private void handleSubscriptionPayment(PaymentCompletedEvent event) {
        log.info("[OBSERVER: BILLING] Processing PaymentCompletedEvent for SaaS Subscription: {}", event);

        SaasSubscriptionTbl subscription = saasSubscriptionRepository.findById(event.referenceId())
                .orElse(null);

        if (subscription == null) {
            log.warn("[OBSERVER: BILLING] Subscription not found for ID: {}", event.referenceId());
            return;
        }

        // Idempotent update
        subscription.setStatus(BillingConstants.SubscriptionStatus.ACTIVE);
        subscription.setCurrentPeriodStart(LocalDateTime.now());
        if (BillingConstants.Cycle.YEARLY.equalsIgnoreCase(subscription.getBillingCycle())) {
            subscription.setCurrentPeriodEnd(LocalDateTime.now().plusYears(1));
        } else {
            subscription.setCurrentPeriodEnd(LocalDateTime.now().plusMonths(1));
        }

        saasSubscriptionRepository.save(subscription);
        log.info("[OBSERVER: BILLING] Successfully updated SaaS Subscription: {} to ACTIVE", subscription.getId());
    }

    private void handleWalletTopUpPayment(PaymentCompletedEvent event) {
        log.info("[OBSERVER: BILLING] Processing PaymentCompletedEvent for Wallet TopUp: {}", event);

        BillingWalletTbl wallet = billingWalletRepository.findById(event.referenceId())
                .orElse(null);

        if (wallet == null) {
            log.warn("[OBSERVER: BILLING] Wallet not found for ID: {}", event.referenceId());
            return;
        }

        double credits = event.amount().doubleValue() * 50.0;
        walletService.creditWallet(wallet.getUserId(), credits, BillingConstants.WalletReason.WALLET_TOPUP, event.transactionId().toString());
        log.info("[OBSERVER: BILLING] Successfully topped up wallet ID: {} with {} credits", wallet.getId(), credits);
    }
}
