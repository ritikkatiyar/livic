package com.livic.core.finance.service.interfaces;

import java.math.BigDecimal;
import com.livic.core.finance.domain.LedgerTransactionType;
import com.livic.core.finance.dto.LedgerDTOs.LedgerEntryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.UUID;

public interface LedgerService {

    /**
     * Appends an entry to a member's ledger. The balance is the member's running balance after
     * this entry; a debit is positive, a payment or credit negative.
     */
    void post(UUID memberId, UUID unitId, LedgerTransactionType type, BigDecimal amount, UUID referenceId, String description);
    Page<LedgerEntryResponse> getLedgerForProperty(UUID propertyId, String search, LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
}
