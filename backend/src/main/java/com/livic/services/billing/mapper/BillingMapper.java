package com.livic.services.billing.mapper;

import com.livic.services.billing.domain.BillingWalletTbl;
import com.livic.services.billing.domain.SaasSubscriptionTbl;
import com.livic.services.billing.dto.BillingStatusResponse;
import com.livic.services.billing.dto.SubscriptionDetailsDto;
import com.livic.services.billing.dto.WalletDetailsDto;

public final class BillingMapper {

    private BillingMapper() {}

    public static SubscriptionDetailsDto toSubscriptionDetailsDto(SaasSubscriptionTbl sub) {
        if (sub == null) {
            return null;
        }
        return SubscriptionDetailsDto.builder()
                .id(sub.getId() != null ? sub.getId().toString() : null)
                .userId(sub.getUserId() != null ? sub.getUserId().toString() : null)
                .planName(sub.getPlanName())
                .status(sub.getStatus())
                .price(sub.getPlan() != null ? sub.getPlan().getPriceMonthly() : null)
                .currentPeriodStart(sub.getCurrentPeriodStart() != null ? sub.getCurrentPeriodStart().toString() : null)
                .currentPeriodEnd(sub.getCurrentPeriodEnd() != null ? sub.getCurrentPeriodEnd().toString() : null)
                .autoRenew(sub.getAutoRenew())
                .gatewaySubscriptionId(sub.getGatewaySubscriptionId())
                .build();
    }

    public static WalletDetailsDto toWalletDetailsDto(BillingWalletTbl wallet) {
        if (wallet == null) {
            return null;
        }
        return WalletDetailsDto.builder()
                .id(wallet.getId() != null ? wallet.getId().toString() : null)
                .userId(wallet.getUserId() != null ? wallet.getUserId().toString() : null)
                .creditBalance(wallet.getCreditBalance())
                .currency(wallet.getCurrency())
                .lastToppedUp(wallet.getLastToppedUp() != null ? wallet.getLastToppedUp().toString() : null)
                .build();
    }

    public static BillingStatusResponse toStatusResponse(SaasSubscriptionTbl subscription, BillingWalletTbl wallet) {
        return BillingStatusResponse.builder()
                .subscription(toSubscriptionDetailsDto(subscription))
                .wallet(toWalletDetailsDto(wallet))
                .build();
    }
}
