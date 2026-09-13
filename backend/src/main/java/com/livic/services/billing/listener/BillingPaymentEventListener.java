package com.livic.services.billing.listener;

import com.livic.services.billing.constant.BillingConstants;
import com.livic.services.billing.domain.BillingWalletTbl;
import com.livic.services.billing.domain.SaasSubscriptionTbl;
import com.livic.services.billing.service.interfaces.BillingWalletCrudService;
import com.livic.services.billing.service.interfaces.BillingWalletService;
import com.livic.services.billing.service.interfaces.SaasSubscriptionCrudService;
import com.livic.platform.payment.constant.PaymentConstants;
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

    private final SaasSubscriptionCrudService subscriptionCrudService;
    private final BillingWalletCrudService walletCrudService;
    private final BillingWalletService walletService;

    @EventListener
    @Transactional
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        if (PaymentConstants.ReferenceType.SAAS_SUBSCRIPTION.equalsIgnoreCase(event.getReferenceType())) {
            handleSubscriptionPayment(event);
        } else if (PaymentConstants.ReferenceType.WALLET_TOPUP.equalsIgnoreCase(event.getReferenceType())) {
            handleWalletTopUpPayment(event);
        }
    }

    private void handleSubscriptionPayment(PaymentCompletedEvent event) {
        log.info("[OBSERVER: BILLING] Processing PaymentCompletedEvent for SaaS Subscription: {}", event);

        SaasSubscriptionTbl subscription = subscriptionCrudService.findById(event.getReferenceId())
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

        subscriptionCrudService.save(subscription);
        log.info("[OBSERVER: BILLING] Successfully updated SaaS Subscription: {} to ACTIVE", subscription.getId());
    }

    private void handleWalletTopUpPayment(PaymentCompletedEvent event) {
        log.info("[OBSERVER: BILLING] Processing PaymentCompletedEvent for Wallet TopUp: {}", event);

        BillingWalletTbl wallet = walletCrudService.findById(event.getReferenceId())
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
