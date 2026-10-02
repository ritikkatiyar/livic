package com.livic.core.finance.facade;

import java.util.Set;
import com.livic.core.finance.dto.BillDraft;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.core.finance.domain.LedgerTransactionType;
import com.livic.core.finance.domain.BillType;
import com.livic.core.finance.dto.ChargeConfigResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface FinanceFacade {

    /** The lease a bill's payer is on, for the rental vertical's own scope resolution. */
    Optional<UUID> getLeaseIdByBillId(UUID billId);

    ChargeConfigResponse getChargeConfigById(UUID chargeConfigId);

    // Analytics Read Methods
    record RevenueMetricsDTO(BigDecimal expected, BigDecimal collected) {}

    record DefaulterRecordDTO(UUID tenantId, String unitNumber, String propertyName, UUID blockId, String blockName, LocalDate dueDate, BigDecimal amountDue, UUID billId) {}

    RevenueMetricsDTO getRevenueMetrics(List<UUID> propertyIds, String billingMonth);


    Page<DefaulterRecordDTO> getDefaulters(List<UUID> propertyIds, Pageable pageable);

    BigDecimal getTotalExpenses(List<UUID> propertyIds);

    Map<String, BigDecimal> getOperationalOverhead(List<UUID> propertyIds);

    // Bill generation, for the verticals that know what a bill should contain

    /** Generates one bill from a draft, or regenerates it if it exists and is not paid. */
    BillDTOs.BillResponse generateBill(BillDraft draft);

    /** Generates each draft in its own transaction; outcomes come back in the order of the drafts. */
    List<BillDraft.Outcome> generateBills(List<BillDraft> drafts);

    /** Members who already have a bill of this type for the month. */
    Set<UUID> getBilledMemberIds(UUID propertyId, String billingMonth, BillType billType);

    /** Whether the member has any bill other than this month's bill of this type. */
    boolean hasOtherBills(UUID memberId, String billingMonth, BillType billType);

    /** Appends to a member's ledger; a debit is positive, a payment or credit negative. */
    void postLedgerEntry(UUID memberId, UUID unitId, LedgerTransactionType type, BigDecimal amount, UUID referenceId, String description);
}
