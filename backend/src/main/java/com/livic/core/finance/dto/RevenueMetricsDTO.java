package com.livic.core.finance.dto;

import java.math.BigDecimal;

public record RevenueMetricsDTO(BigDecimal expected, BigDecimal collected) {
    public RevenueMetricsDTO(BigDecimal expected, BigDecimal collected) {
        this.expected = expected != null ? expected : BigDecimal.ZERO;
        this.collected = collected != null ? collected : BigDecimal.ZERO;
    }

    public RevenueMetricsDTO(Object expected, Object collected) {
        this(
            expected != null ? new BigDecimal(expected.toString()) : BigDecimal.ZERO,
            collected != null ? new BigDecimal(collected.toString()) : BigDecimal.ZERO
        );
    }
}
