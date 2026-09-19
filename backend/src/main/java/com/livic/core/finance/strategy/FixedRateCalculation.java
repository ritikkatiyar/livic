package com.livic.core.finance.strategy;

import com.livic.platform.common.domain.CalculationStrategyType;
import com.livic.platform.common.exception.BusinessException;
import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.core.finance.domain.BillingWorksheetEntryTbl;
import com.livic.core.finance.repository.BillingWorksheetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class FixedRateCalculation implements ChargeCalculation {

    private final BillingWorksheetRepository worksheetRepository;

    @Override
    public CalculationStrategyType getStrategyType() {
        return CalculationStrategyType.FIXED_RATE;
    }

    @Override
    public CalculationResult calculate(ChargeConfigTbl config, UUID unitId, String billingMonth) {
        BillingWorksheetEntryTbl entry = worksheetRepository.findByUnitIdAndChargeConfigIdAndBillingMonth(
                unitId, config.getId(), billingMonth)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND,
                        "Billing worksheet entry not initialized for unit " + unitId + " and charge " + config.getChargeName()));

        BigDecimal amount = entry.getEnteredValue() != null ? entry.getEnteredValue() : BigDecimal.ZERO;

        if (amount.compareTo(BigDecimal.ZERO) == 0) {
            if (config.getBaseRate() == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST,
                        "Worksheet entry for '" + config.getChargeName() +
                        "' must be entered because it has no configured base rate.");
            }
            amount = config.getBaseRate();
        }

        return new CalculationResult(amount, null);
    }
}
