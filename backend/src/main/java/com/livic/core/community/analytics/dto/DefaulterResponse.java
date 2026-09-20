package com.livic.core.community.analytics.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record DefaulterResponse(
        String tenantName,
        String unitNumber,
        String propertyName,
        int daysOverdue,
        BigDecimal amountDue,
        UUID billId
) {}
