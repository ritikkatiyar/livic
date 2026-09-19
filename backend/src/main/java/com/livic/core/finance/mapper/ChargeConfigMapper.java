package com.livic.core.finance.mapper;

import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.core.finance.dto.ChargeConfigRequest;
import com.livic.core.finance.dto.ChargeConfigResponse;
import com.livic.core.property.domain.PropertyTbl;

import java.util.UUID;

public final class ChargeConfigMapper {

    private ChargeConfigMapper() {
    }

    public static ChargeConfigTbl toEntity(ChargeConfigRequest request, UUID propertyId) {
        return ChargeConfigTbl.builder()
                .propertyId(propertyId)
                .chargeName(request.getChargeName())
                .chargeCategory(request.getChargeCategory())
                .billingFrequency(request.getBillingFrequency())
                .calculationStrategy(request.getCalculationStrategy())
                .unitType(request.getUnitType())
                .baseRate(request.getBaseRate())
                .applySalesTax(request.getApplySalesTax())
                .lateFeePercentage(request.getLateFeePercentage())
                .autoCarryForward(request.getAutoCarryForward() != null ? request.getAutoCarryForward() : false)
                .isActive(true)
                .isSystemRequired(false)
                .build();
    }

    public static ChargeConfigTbl createSystemRentConfig(UUID propertyId) {
        return ChargeConfigTbl.builder()
                .propertyId(propertyId)
                .chargeName("Base Rent")
                .chargeCategory(com.livic.platform.common.domain.ChargeCategory.RENT)
                .billingFrequency(com.livic.platform.common.domain.BillingFrequency.MONTHLY)
                .calculationStrategy(com.livic.platform.common.domain.CalculationStrategyType.FIXED_RATE)
                .baseRate(null)
                .applySalesTax(false)
                .autoCarryForward(false)
                .isSystemRequired(true)
                .isActive(true)
                .build();
    }

    public static void updateEntity(ChargeConfigRequest request, ChargeConfigTbl config) {
        config.setChargeName(request.getChargeName());
        config.setChargeCategory(request.getChargeCategory());
        config.setBillingFrequency(request.getBillingFrequency());
        config.setCalculationStrategy(request.getCalculationStrategy());
        config.setUnitType(request.getUnitType());
        config.setBaseRate(request.getBaseRate());
        config.setApplySalesTax(request.getApplySalesTax());
        config.setLateFeePercentage(request.getLateFeePercentage());
        if (request.getAutoCarryForward() != null) {
            config.setAutoCarryForward(request.getAutoCarryForward());
        }
    }

    public static ChargeConfigResponse toResponse(ChargeConfigTbl config) {
        return ChargeConfigResponse.builder()
                .id(config.getId())
                .propertyId(config.getPropertyId())
                .chargeName(config.getChargeName())
                .chargeCategory(config.getChargeCategory())
                .billingFrequency(config.getBillingFrequency())
                .calculationStrategy(config.getCalculationStrategy())
                .unitType(config.getUnitType())
                .baseRate(config.getBaseRate())
                .applySalesTax(config.getApplySalesTax())
                .lateFeePercentage(config.getLateFeePercentage())
                .isSystemRequired(config.getIsSystemRequired())
                .isActive(config.getIsActive())
                .autoCarryForward(config.getAutoCarryForward())
                .build();
    }
}
