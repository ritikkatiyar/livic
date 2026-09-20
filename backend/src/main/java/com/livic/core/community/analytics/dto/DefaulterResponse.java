package com.livic.core.community.analytics.dto;

import java.math.BigDecimal;

public record DefaulterResponse(
        String tenantName,
        String unitNumber,
        String propertyName,
        int daysOverdue,
        BigDecimal amountDue,
        String billId
) {}
