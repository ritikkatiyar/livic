package com.livic.core.finance.dto;

import com.livic.core.finance.domain.BillType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * A bill to generate, in core's terms: who pays, who issues it, for which month, and the lines
 * the caller already knows. Rental passes the lease's rent and any token adjustment; core adds
 * the property's charges from the worksheet and meter readings.
 *
 * @param issuedByMemberId null when the property itself issues the bill
 * @param shareCount       how many payers share the unit's charges (roommates); 1 for none
 */
public record BillDraft(
        UUID payerMemberId,
        UUID issuedByMemberId,
        BillType billType,
        String billingMonth,
        LocalDate dueDate,
        List<Line> lines,
        int shareCount
) {

    /** A line the caller supplies. The amount is signed; a credit to the payer is negative. */
    public record Line(String description, BigDecimal amount) {
    }

    /** What happened to one draft in a batch: the bill, or why it could not be generated. */
    public record Outcome(BillDTOs.BillResponse bill, String failure) {
    }
}
