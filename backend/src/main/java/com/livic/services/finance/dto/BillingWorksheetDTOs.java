package com.livic.services.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class BillingWorksheetDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorksheetSaveRequest {
        @NotNull
        private UUID propertyId;
        @NotNull
        private UUID chargeConfigId;
        @NotNull
        private String billingMonth;
        @NotNull
        private List<UnitEntry> entries;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UnitEntry {
        @NotNull
        private UUID unitId;
        @NotNull
        private BigDecimal enteredValue;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorksheetEntryResponse {
        private UUID id;
        private UUID unitId;
        private String unitName; 
        private String tenantName;
        private Integer floor;
        private BigDecimal enteredValue;
        private boolean isBilled;
    }
}
