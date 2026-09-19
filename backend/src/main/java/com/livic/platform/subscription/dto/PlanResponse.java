package com.livic.platform.subscription.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanResponse {
    private String id;
    private String planKey;
    private String name;
    private BigDecimal priceMonthly;
    private BigDecimal priceYearly;
    private String currency;
    private List<FeatureDisplayItem> features;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeatureDisplayItem {
        private String featureKey;
        private String displayLabel;
        private Integer limitValue;
        private Boolean included;
    }
}
