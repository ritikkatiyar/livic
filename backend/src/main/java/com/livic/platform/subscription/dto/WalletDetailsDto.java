package com.livic.platform.subscription.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletDetailsDto {
    private String id;
    private String userId;
    private BigDecimal creditBalance;
    private String currency;
    private String lastToppedUp;
}
