package com.livic.services.finance.strategy;

import com.livic.services.finance.domain.ChargeConfigTbl;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

public class LateFeeDecorator extends ChargeModifierDecorator {

    public LateFeeDecorator(ChargeCalculation wrappedCalculation) {
        super(wrappedCalculation);
    }

    @Override
    public CalculationResult calculate(ChargeConfigTbl config, UUID unitId, String billingMonth) {
        // Get the base amount (which might already include tax if wrapped sequentially)
        CalculationResult baseResult = super.calculate(config, unitId, billingMonth);
        BigDecimal baseAmount = baseResult.amount();
        
        // Add the configured late fee percentage
        if (config.getLateFeePercentage() != null) {
            BigDecimal lateFeeRate = config.getLateFeePercentage().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
            BigDecimal penalty = baseAmount.multiply(lateFeeRate).setScale(2, RoundingMode.HALF_UP);
            return new CalculationResult(baseAmount.add(penalty), baseResult.descriptionDetail());
        }
        
        return baseResult;
    }
}
