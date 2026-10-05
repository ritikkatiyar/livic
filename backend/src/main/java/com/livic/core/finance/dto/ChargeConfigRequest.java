package com.livic.core.finance.dto;

import com.livic.core.finance.domain.BillingFrequency;
import com.livic.core.finance.domain.CalculationStrategyType;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ChargeConfigRequest {
    private UUID propertyId;
    private String chargeName;
    private BillingFrequency billingFrequency;
    private CalculationStrategyType calculationStrategy;
    private String unitType;
    private BigDecimal baseRate;
    private Boolean applySalesTax;
    private BigDecimal lateFeePercentage;
    private Boolean autoCarryForward;
}
