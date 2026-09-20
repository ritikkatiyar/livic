package com.livic.core.finance.dto;

import java.math.BigDecimal;

public record RentRollMetricsDTO(
        BigDecimal totalExpectedRevenue,
        long pendingDraftsCount,
        long publishedCount
) {
    public RentRollMetricsDTO(BigDecimal totalExpectedRevenue, long pendingDraftsCount, long publishedCount) {
        this.totalExpectedRevenue = totalExpectedRevenue != null ? totalExpectedRevenue : BigDecimal.ZERO;
        this.pendingDraftsCount = pendingDraftsCount;
        this.publishedCount = publishedCount;
    }

    public RentRollMetricsDTO(Object totalExpectedRevenue, Object pendingDraftsCount, Object publishedCount) {
        this(
                totalExpectedRevenue != null
                        ? (totalExpectedRevenue instanceof BigDecimal bd ? bd : new BigDecimal(totalExpectedRevenue.toString()))
                        : BigDecimal.ZERO,
                pendingDraftsCount != null ? ((Number) pendingDraftsCount).longValue() : 0L,
                publishedCount != null ? ((Number) publishedCount).longValue() : 0L
        );
    }
}
