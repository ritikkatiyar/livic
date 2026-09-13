package com.livic.services.finance.strategy;

import com.livic.services.finance.domain.ChargeConfigTbl;
import com.livic.platform.common.domain.CalculationStrategyType;
import java.util.UUID;

public interface ChargeCalculation {
    /**
     * Calculates the charge amount for a given unit.
     */
    CalculationResult calculate(ChargeConfigTbl config, UUID unitId, String billingMonth);
    
    /**
     * Returns the strategy type this calculation handles (only relevant for base strategies).
     */
    default CalculationStrategyType getStrategyType() {
        return null;
    }
}
