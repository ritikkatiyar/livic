package com.livic.services.finance.strategy;

import com.livic.services.finance.domain.ChargeConfigTbl;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

public class SalesTaxDecorator extends ChargeModifierDecorator {

    public SalesTaxDecorator(ChargeCalculation wrappedCalculation) {
        super(wrappedCalculation);
    }

    @Override
    public CalculationResult calculate(ChargeConfigTbl config, UUID unitId, String billingMonth) {
        // Get the base amount
        CalculationResult baseResult = super.calculate(config, unitId, billingMonth);
        BigDecimal baseAmount = baseResult.amount();
        
        // Example: Apply a flat 5% state tax (0.05) if the config requires it
        BigDecimal taxRate = new BigDecimal("0.05");
        BigDecimal taxAmount = baseAmount.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        
        return new CalculationResult(baseAmount.add(taxAmount), baseResult.descriptionDetail());
    }
}
