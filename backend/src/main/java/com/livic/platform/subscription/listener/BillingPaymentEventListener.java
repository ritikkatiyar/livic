package com.livic.platform.subscription.listener;

import com.livic.platform.subscription.repository.SaasSubscriptionRepository;
import com.livic.platform.subscription.repository.BillingWalletRepository;
import com.livic.platform.subscription.constant.BillingConstants;
import com.livic.platform.subscription.domain.BillingWalletTbl;
import com.livic.platform.subscription.domain.SaasSubscriptionTbl;
import com.livic.platform.subscription.service.interfaces.BillingWalletService;
import com.livic.platform.payment.event.PaymentCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class BillingPaymentEventListener {

    private final SaasSubscriptionRepository saasSubscriptionRepository;
    private final BillingWalletRepository billingWalletRepository;
    private final BillingWalletService walletService;

    /** What subscription calls its payments; payment hands them back untouched. */
    public static final String SUBSCRIPTION_REFERENCE_TYPE = "SAAS_SUBSCRIPTION";
    public static final String WALLET_TOPUP_REFERENCE_TYPE = "WALLET_TOPUP";

    @EventListener
    @Transactional
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        if (SUBSCRIPTION_REFERENCE_TYPE.equalsIgnoreCase(event.getReferenceType())) {
            handleSubscriptionPayment(event);
        } else if (WALLET_TOPUP_REFERENCE_TYPE.equalsIgnoreCase(event.getReferenceType())) {
            handleWalletTopUpPayment(event);
        }
    }

    private void handleSubscriptionPayment(PaymentCompletedEvent event) {
        log.info("[OBSERVER: BILLING] Processing PaymentCompletedEvent for SaaS Subscription: {}", event);

        SaasSubscriptionTbl subscription = saasSubscriptionRepository.findById(event.getReferenceId())
                .orElse(null);

        if (subscription == null) {
            log.warn("[OBSERVER: BILLING] Subscription not found for ID: {}", event.getReferenceId());
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

        BillingWalletTbl wallet = billingWalletRepository.findById(event.getReferenceId())
                .orElse(null);

        if (wallet == null) {
            log.warn("[OBSERVER: BILLING] Wallet not found for ID: {}", event.getReferenceId());
            return;
        }

        double credits = event.getAmount().doubleValue() * 50.0;
        walletService.creditWallet(wallet.getUserId(), credits, BillingConstants.WalletReason.WALLET_TOPUP, event.getTransactionId().toString());
        log.info("[OBSERVER: BILLING] Successfully topped up wallet ID: {} with {} credits", wallet.getId(), credits);
    }
}
