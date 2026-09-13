package com.livic.services.billing.dto;

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
