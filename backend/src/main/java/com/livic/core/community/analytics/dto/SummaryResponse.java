package com.livic.core.community.analytics.dto;

import java.math.BigDecimal;

public record SummaryResponse(
        BigDecimal expectedRevenue,
        BigDecimal collectedRevenue,
        BigDecimal collectionRate,
        BigDecimal totalExpenses,
        BigDecimal expenseGrowthRate,
        BigDecimal netProfit,
        BigDecimal profitGrowthRate
) {}
