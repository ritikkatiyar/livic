package com.livic.core.finance.strategy;

import com.livic.platform.common.domain.CalculationStrategyType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ChargeCalculationFactory {

    private final Map<CalculationStrategyType, ChargeCalculation> baseStrategies;

    @Autowired
    public ChargeCalculationFactory(List<ChargeCalculation> strategyList) {
        this.baseStrategies = strategyList.stream()
                .filter(strategy -> strategy.getStrategyType() != null)
                .collect(Collectors.toMap(
                        ChargeCalculation::getStrategyType,
                        Function.identity()
                ));
    }

    public ChargeCalculation getBaseStrategy(CalculationStrategyType type) {
        ChargeCalculation strategy = baseStrategies.get(type);
        if (strategy == null) {
            throw new IllegalArgumentException("No calculation strategy found for type: " + type);
        }
        return strategy;
    }
}
