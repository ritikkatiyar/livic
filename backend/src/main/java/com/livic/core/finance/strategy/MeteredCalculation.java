package com.livic.core.finance.strategy;

import com.livic.core.finance.repository.MeterReadingRepository;
import com.livic.core.finance.domain.CalculationStrategyType;
import com.livic.core.finance.domain.ChargeConfigTbl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MeteredCalculation implements ChargeCalculation {

    private final MeterReadingRepository meterReadingRepository;

    @Override
    public CalculationStrategyType getStrategyType() {
        return CalculationStrategyType.METERED;
    }

    @Override
    public CalculationResult calculate(ChargeConfigTbl config, UUID unitId, String billingMonth) {
        String[] parts = billingMonth.split("-");
        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);

        return meterReadingRepository.findByUnitIdAndChargeConfigIdAndBillingMonthAndBillingYear(
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
