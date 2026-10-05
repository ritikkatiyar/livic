package com.livic.core.finance.service.impl;

import com.livic.core.finance.repository.ChargeConfigRepository;
import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.core.finance.dto.ChargeConfigResponse;
import com.livic.core.finance.service.interfaces.ChargeConfigQueryService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChargeConfigQueryServiceImpl implements ChargeConfigQueryService {

    private final ChargeConfigRepository chargeConfigRepository;

    @Override
    public Page<ChargeConfigResponse> getChargesForProperty(UUID propertyId, boolean includeInactive, Pageable pageable) {
        Page<ChargeConfigTbl> configPage = includeInactive ? 
                chargeConfigRepository.findAllByPropertyId(propertyId, pageable) : 
                chargeConfigRepository.findAllByPropertyIdAndIsActiveTrue(propertyId, pageable);

        return configPage.map(this::mapToResponse);
    }

    @Override
    public ChargeConfigResponse getChargeConfigById(UUID id) {
        ChargeConfigTbl config = chargeConfigRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Charge Config not found"));
        return mapToResponse(config);
    }

    private ChargeConfigResponse mapToResponse(ChargeConfigTbl config) {
        return ChargeConfigResponse.builder()
                .id(config.getId())
                .propertyId(config.getPropertyId())
                .chargeName(config.getChargeName())
                .billingFrequency(config.getBillingFrequency())
                .calculationStrategy(config.getCalculationStrategy())
                .unitType(config.getUnitType())
                .baseRate(config.getBaseRate())
                .applySalesTax(config.getApplySalesTax())
                .lateFeePercentage(config.getLateFeePercentage())
                .isActive(config.getIsActive())
                .autoCarryForward(config.getAutoCarryForward())
                .build();
    }
}
