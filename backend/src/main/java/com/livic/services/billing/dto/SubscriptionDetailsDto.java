package com.livic.services.billing.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionDetailsDto {
    private String id;
    private String userId;
    private String planName;
    private String status;
    private BigDecimal price;
    private String currentPeriodStart;
    private String currentPeriodEnd;
    private Boolean autoRenew;
    private String gatewaySubscriptionId;
}
