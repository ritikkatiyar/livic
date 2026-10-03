package com.livic.core.finance.event;

import com.livic.core.finance.domain.BillType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** A bill became visible to its payer. {@code payerUserId} is null when the payer has no account. */
public record BillPublishedEvent(
        UUID billId,
        BillType billType,
        UUID payerUserId,
        String billingMonth,
        BigDecimal totalAmount,
        LocalDate dueDate
) {
}
