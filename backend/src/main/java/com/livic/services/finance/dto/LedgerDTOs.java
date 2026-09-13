package com.livic.services.finance.dto;

import com.livic.platform.common.domain.LedgerTransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class LedgerDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LedgerEntryResponse {
        private UUID id;
        private String unitName;
        private String tenantName;
        private LedgerTransactionType transactionType;
        private BigDecimal amount;
        private BigDecimal balance;
        private UUID referenceId;
        private String description;
        private LocalDateTime createdAt;
    }
}
