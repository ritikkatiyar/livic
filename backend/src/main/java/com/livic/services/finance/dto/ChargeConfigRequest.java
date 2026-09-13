package com.livic.services.finance.dto;

import com.livic.platform.common.domain.BillingFrequency;
import com.livic.platform.common.domain.CalculationStrategyType;
import com.livic.platform.common.domain.ChargeCategory;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ChargeConfigRequest {
    private UUID propertyId;
    private String chargeName;
    private ChargeCategory chargeCategory;
    private BillingFrequency billingFrequency;
    private CalculationStrategyType calculationStrategy;
    private String unitType;
    private BigDecimal baseRate;
    private Boolean applySalesTax;
    private BigDecimal lateFeePercentage;
    private Boolean autoCarryForward;
}
