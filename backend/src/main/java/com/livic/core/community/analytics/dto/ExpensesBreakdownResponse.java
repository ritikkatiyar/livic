package com.livic.core.community.analytics.dto;

import java.math.BigDecimal;
import java.util.Map;

public record ExpensesBreakdownResponse(
        BigDecimal totalExpenses,
        BigDecimal growthFromLastMonth,
        Map<String, BigDecimal> operationalOverhead
) {}
