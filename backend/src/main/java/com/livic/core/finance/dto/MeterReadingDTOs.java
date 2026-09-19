package com.livic.core.finance.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class MeterReadingDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MeterReadingResponse {
        private UUID id;
        private UUID unitId;
        private String unitName;
        private String tenantName;
        private Integer floor;
        private BigDecimal previousReading;
        private BigDecimal currentReading;
        private Boolean isBilled;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnitReading {
        private UUID unitId;
        private BigDecimal previousReading;
        private BigDecimal currentReading;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MeterReadingRequest {
        private UUID propertyId;
        private UUID chargeConfigId;
        private Integer billingMonth;
        private Integer billingYear;
        private List<UnitReading> readings;
    }
}
