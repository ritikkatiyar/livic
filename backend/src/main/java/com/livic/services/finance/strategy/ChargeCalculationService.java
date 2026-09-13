package com.livic.services.finance.strategy;

import com.livic.services.finance.domain.ChargeConfigTbl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ChargeCalculationService {

    private final ChargeCalculationFactory strategyFactory;

    @Autowired
    public ChargeCalculationService(ChargeCalculationFactory strategyFactory) {
        this.strategyFactory = strategyFactory;
    }

    /**
     * Dynamically builds a calculation pipeline (Strategy + Decorators) based on the specific Charge Configuration.
     */
    public CalculationResult executeChargePipeline(ChargeConfigTbl config, UUID unitId, String billingMonth, boolean isPaymentLate) {
        
        // 1. Get Base Calculation Strategy
        ChargeCalculation calculationPipeline = strategyFactory.getBaseStrategy(config.getCalculationStrategy());
        
        // 2. Wrap Pipeline with Tax Decorator (If Applicable)
        if (Boolean.TRUE.equals(config.getApplySalesTax())) {
            calculationPipeline = new SalesTaxDecorator(calculationPipeline);
        }
        
        // 3. Wrap Pipeline with Late Fee Decorator (If Applicable and Payment is Late)
        if (isPaymentLate && config.getLateFeePercentage() != null) {
            calculationPipeline = new LateFeeDecorator(calculationPipeline);
        }
        
        // 4. Calculate and return Final Result
        return calculationPipeline.calculate(config, unitId, billingMonth);
    }
}
