package com.livic.core.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DefaulterRecordDTO(
        UUID tenantId,
        String unitNumber,
        String propertyName,
        UUID blockId,
        String blockName,
        LocalDate dueDate,
        BigDecimal amountDue,
        UUID billId
) {}
