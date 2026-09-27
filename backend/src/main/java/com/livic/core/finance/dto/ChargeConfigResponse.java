package com.livic.core.finance.dto;

import com.livic.core.finance.domain.BillingFrequency;
import com.livic.core.finance.domain.CalculationStrategyType;
import com.livic.core.finance.domain.ChargeCategory;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ChargeConfigResponse {
    private UUID id;
    private UUID propertyId;
    private String chargeName;
    private ChargeCategory chargeCategory;
    private BillingFrequency billingFrequency;
    private CalculationStrategyType calculationStrategy;
    private String unitType;
    private BigDecimal baseRate;
    private Boolean applySalesTax;
    private BigDecimal lateFeePercentage;
    private Boolean isSystemRequired;
    private Boolean isActive;
    private Boolean autoCarryForward;
}
