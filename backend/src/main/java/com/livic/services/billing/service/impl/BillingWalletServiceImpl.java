package com.livic.services.billing.service.impl;

import com.livic.services.billing.constant.BillingConstants;
import com.livic.platform.payment.constant.PaymentConstants;
import com.livic.services.billing.domain.BillingWalletTbl;
import com.livic.platform.payment.dto.PaymentGatewayType;
import com.livic.services.billing.domain.SaasSubscriptionTbl;
import com.livic.services.billing.domain.SubscriptionPlanTbl;
import com.livic.services.billing.domain.WalletTransactionTbl;
import com.livic.platform.payment.dto.PaymentIntentRequest;
import com.livic.platform.payment.dto.PaymentIntentResponse;
import com.livic.platform.payment.dto.SubscriptionRequest;
import com.livic.services.billing.service.interfaces.BillingWalletCrudService;
import com.livic.services.billing.service.interfaces.BillingWalletService;
import com.livic.services.billing.service.interfaces.SaasSubscriptionCrudService;
import com.livic.services.billing.service.interfaces.SubscriptionPlanCrudService;
import com.livic.services.billing.service.interfaces.WalletTransactionCrudService;
import com.livic.platform.payment.dto.PaymentInitiationRequest;
import com.livic.platform.payment.dto.PaymentInitiationResponse;
import com.livic.platform.payment.facade.PaymentFacade;
import com.livic.platform.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingWalletServiceImpl implements BillingWalletService {

    private final BillingWalletCrudService walletCrudService;
    private final WalletTransactionCrudService transactionCrudService;
    private final SaasSubscriptionCrudService subscriptionCrudService;
    private final SubscriptionPlanCrudService planCrudService;
    private final PaymentFacade paymentFacade;

    @Override
    @Transactional(readOnly = true)
    public boolean hasBalance(UUID userId, double requiredCredits) {
        if (requiredCredits <= 0) {
            return true;
        }
        BillingWalletTbl wallet = walletCrudService.findByUserId(userId).orElse(null);
        if (wallet == null) {
            return 50.0 >= requiredCredits;
        }
        return wallet.getCreditBalance().doubleValue() >= requiredCredits;
    }

    @Override
    @Transactional
    public void debitWallet(UUID userId, double requiredCredits, String reason) {
        if (requiredCredits <= 0) {
            return;
        }

        BillingWalletTbl wallet = walletCrudService.findByUserIdForUpdate(userId)
                .orElseGet(() -> getOrCreateWallet(userId));

        BigDecimal required = BigDecimal.valueOf(requiredCredits);
        if (wallet.getCreditBalance().compareTo(required) < 0) {
            throw new BusinessException(HttpStatus.PAYMENT_REQUIRED,
                    "Insufficient credit balance. Required: " + requiredCredits + ", Available: " + wallet.getCreditBalance());
        }

        wallet.setCreditBalance(wallet.getCreditBalance().subtract(required));
        walletCrudService.save(wallet);

        WalletTransactionTbl transaction = WalletTransactionTbl.builder()
                .walletId(wallet.getId())
                .amount(required.negate())
                .transactionType(BillingConstants.WalletTxType.DEBIT)
                .reason(reason)
                .build();
        transactionCrudService.save(transaction);

        log.info("[WALLET DEBIT] Successfully debited {} credits from user: {}. New balance: {}",
                requiredCredits, userId, wallet.getCreditBalance());
    }

    @Override
    @Transactional
    public void creditWallet(UUID userId, double credits, String reason, String referenceId) {
        if (credits <= 0) {
            return;
        }

        BillingWalletTbl wallet = walletCrudService.findByUserIdForUpdate(userId)
                .orElseGet(() -> {
                    BillingWalletTbl newWallet = BillingWalletTbl.builder()
                            .userId(userId)
                            .creditBalance(BigDecimal.ZERO)
                            .currency(BillingConstants.Currency.DEFAULT_CURRENCY)
                            .build();
                    return walletCrudService.save(newWallet);
                });

        if (referenceId != null && transactionCrudService.existsByWalletIdAndReferenceId(wallet.getId(), referenceId)) {
            log.info("[WALLET CREDIT] Transaction with referenceId {} already credited for wallet: {}. Skipping.", referenceId, wallet.getId());
            return;
        }

        BigDecimal addition = BigDecimal.valueOf(credits);
        wallet.setCreditBalance(wallet.getCreditBalance().add(addition));
        wallet.setLastToppedUp(LocalDateTime.now());
        walletCrudService.save(wallet);

        WalletTransactionTbl transaction = WalletTransactionTbl.builder()
                .walletId(wallet.getId())
                .amount(addition)
                .transactionType(BillingConstants.WalletTxType.CREDIT)
                .reason(reason)
                .referenceId(referenceId)
                .build();
        transactionCrudService.save(transaction);

        log.info("[WALLET CREDIT] Successfully credited {} credits to user: {}. New balance: {}", 
                credits, userId, wallet.getCreditBalance());
    }

    @Override
    @Transactional(readOnly = true)
    public double getRemainingBalance(UUID userId) {
        BillingWalletTbl wallet = walletCrudService.findByUserId(userId).orElse(null);
        if (wallet == null) {
            return 50.0;
        }
        return wallet.getCreditBalance().doubleValue();
    }

    @Override
    @Transactional
    public BillingWalletTbl getOrCreateWallet(UUID userId) {
        return walletCrudService.findByUserId(userId)
                .orElseGet(() -> {
                    BillingWalletTbl newWallet = BillingWalletTbl.builder()
                            .userId(userId)
                            .creditBalance(BigDecimal.valueOf(50.0))
                            .currency(BillingConstants.Currency.DEFAULT_CURRENCY)
                            .build();
                    return walletCrudService.save(newWallet);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public com.livic.services.billing.dto.BillingStatusResponse getBillingStatus(UUID userId) {
        SaasSubscriptionTbl subscription = getActiveSubscription(userId);
        BillingWalletTbl wallet = getOrCreateWallet(userId);
        return com.livic.services.billing.mapper.BillingMapper.toStatusResponse(subscription, wallet);
    }

    @Override
    @Transactional(readOnly = true)
    public SaasSubscriptionTbl getActiveSubscription(UUID userId) {
        return subscriptionCrudService.findLatestByUserIdAndStatus(userId, BillingConstants.SubscriptionStatus.ACTIVE)
                .orElseGet(() -> {
                    SubscriptionPlanTbl starterPlan = planCrudService.findByPlanKey(BillingConstants.PlanKey.STARTER).orElse(null);
                    return SaasSubscriptionTbl.builder()
                            .userId(userId)
                            .plan(starterPlan)
                            .status(BillingConstants.SubscriptionStatus.ACTIVE)
                            .billingCycle(BillingConstants.Cycle.MONTHLY)
                            .currentPeriodStart(LocalDateTime.now())
                            .currentPeriodEnd(LocalDateTime.now().plusYears(100))
                            .autoRenew(false)
                            .build();
                });
    }

    @Override
    @Transactional
    public PaymentIntentResponse topUpWallet(UUID userId, String username, PaymentIntentRequest request) {
        log.info("Executing topUpWallet for user: {} amount: {}", userId, request.amount());

        BillingWalletTbl wallet = getOrCreateWallet(userId);

        PaymentInitiationRequest initRequest = PaymentInitiationRequest.builder()
                .payerUserId(userId)
                .referenceType(PaymentConstants.ReferenceType.WALLET_TOPUP)
                .referenceId(wallet.getId())
                .amount(BigDecimal.valueOf(request.amount()))
                .paymentMethod(PaymentConstants.Method.ONLINE)
                .description("AI Credit Wallet Top-up")
                .build();

        PaymentInitiationResponse initResponse = paymentFacade.initiateOnlinePayment(initRequest);

        return new PaymentIntentResponse(
                initResponse.getTransactionId().toString(),
                null,
                initResponse.getGatewayTransactionId(),
                null,
                initResponse.getStatus()
        );
    }

    @Override
    @Transactional
    public PaymentInitiationResponse subscribeToPlan(UUID userId, SubscriptionRequest request) {
        log.info("Executing subscribeToPlan for user: {} plan: {} cycle: {}", userId, request.planName(), request.billingCycle());

        String targetPlanKey = request.planName() != null ? request.planName().trim().toUpperCase() : BillingConstants.PlanKey.STARTER;

        SubscriptionPlanTbl plan = planCrudService.findByPlanKey(targetPlanKey)
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "Plan not found: " + request.planName()));

        // Create or update the pending subscription record safely
        SaasSubscriptionTbl subscription = subscriptionCrudService.findLatestByUserIdAndStatus(userId, BillingConstants.SubscriptionStatus.PENDING)
                .orElse(null);

        LocalDateTime now = LocalDateTime.now();
        String cycle = request.billingCycle() != null ? request.billingCycle() : BillingConstants.Cycle.MONTHLY;
        LocalDateTime periodEnd = BillingConstants.Cycle.YEARLY.equalsIgnoreCase(cycle) ? now.plusYears(1) : now.plusMonths(1);

        if (subscription == null) {
            subscription = SaasSubscriptionTbl.builder()
                    .userId(userId)
                    .plan(plan)
                    .status(BillingConstants.SubscriptionStatus.PENDING)
                    .billingCycle(cycle)
                    .currentPeriodStart(now)
                    .currentPeriodEnd(periodEnd)
                    .autoRenew(true)
                    .gatewayType(PaymentConstants.Gateway.RAZORPAY)
                    .build();
        } else {
            subscription.setPlan(plan);
            subscription.setBillingCycle(cycle);
            subscription.setCurrentPeriodStart(now);
            subscription.setCurrentPeriodEnd(periodEnd);
            subscription.setStatus(BillingConstants.SubscriptionStatus.PENDING);
        }

        subscription = subscriptionCrudService.saveAndFlush(subscription);

        // Build payment request with the subscription's ID as referenceId
        PaymentInitiationRequest initRequest = PaymentInitiationRequest.builder()
                .payerUserId(userId)
                .referenceType(PaymentConstants.ReferenceType.SAAS_SUBSCRIPTION)
                .referenceId(subscription.getId())
                .amount(BigDecimal.valueOf(request.amount()))
                .paymentMethod(PaymentConstants.Method.ONLINE)
                .description(plan.getName() + " Subscription (" + cycle + ")")
                .build();

        return paymentFacade.initiateOnlinePayment(initRequest);
    }
}
