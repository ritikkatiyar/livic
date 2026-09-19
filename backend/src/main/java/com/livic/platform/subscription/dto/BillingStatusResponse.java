package com.livic.platform.subscription.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingStatusResponse {
    private SubscriptionDetailsDto subscription;
    private WalletDetailsDto wallet;
}
