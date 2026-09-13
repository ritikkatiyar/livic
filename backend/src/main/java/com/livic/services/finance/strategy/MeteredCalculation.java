package com.livic.services.finance.strategy;

import com.livic.platform.common.domain.CalculationStrategyType;
import com.livic.services.finance.domain.ChargeConfigTbl;
import com.livic.services.finance.domain.MeterReadingTbl;
import com.livic.services.finance.service.interfaces.MeterReadingCrudService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MeteredCalculation implements ChargeCalculation {

    private final MeterReadingCrudService meterReadingCrudService;

    @Override
    public CalculationStrategyType getStrategyType() {
        return CalculationStrategyType.METERED;
    }

    @Override
    public CalculationResult calculate(ChargeConfigTbl config, UUID unitId, String billingMonth) {
        String[] parts = billingMonth.split("-");
        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);

        return meterReadingCrudService.findByUnitIdAndChargeConfigIdAndBillingMonthAndBillingYear(
                unitId, config.getId(), month, year)
                .map(reading -> {
                    BigDecimal current = reading.getCurrentReading();
                    if (current == null) {
                        return new CalculationResult(BigDecimal.ZERO, null);
                    }

                    BigDecimal consumption = current.subtract(reading.getPreviousReading());
                    if (consumption.compareTo(BigDecimal.ZERO) < 0) {
                        consumption = BigDecimal.ZERO;
                    }

                    BigDecimal rate = config.getBaseRate() != null ? config.getBaseRate() : BigDecimal.ZERO;
                    BigDecimal amount = consumption.multiply(rate);

                    return new CalculationResult(amount, consumption + " units");
                })
                .orElse(new CalculationResult(BigDecimal.ZERO, null));
    }
}
