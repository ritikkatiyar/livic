package com.livic.services.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DefaulterRecordDTO(
        UUID tenantId,
        String unitNumber,
        String propertyName,
        LocalDate dueDate,
        BigDecimal amountDue,
        UUID rentCycleId
) {}
