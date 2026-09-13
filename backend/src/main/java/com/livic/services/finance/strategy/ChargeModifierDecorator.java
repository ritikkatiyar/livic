package com.livic.services.finance.strategy;

import com.livic.services.finance.domain.ChargeConfigTbl;
import java.util.UUID;

public abstract class ChargeModifierDecorator implements ChargeCalculation {
    
    protected final ChargeCalculation wrappedCalculation;

    public ChargeModifierDecorator(ChargeCalculation wrappedCalculation) {
        this.wrappedCalculation = wrappedCalculation;
    }

    @Override
    public CalculationResult calculate(ChargeConfigTbl config, UUID unitId, String billingMonth) {
        return wrappedCalculation.calculate(config, unitId, billingMonth);
    }
}
