package com.livic.core.finance.service.impl;

import com.livic.core.finance.repository.ChargeConfigRepository;
import com.livic.core.finance.domain.ChargeCategory;
import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.core.finance.dto.ChargeConfigResponse;
import com.livic.core.finance.mapper.ChargeConfigMapper;
import com.livic.core.finance.service.interfaces.ChargeConfigQueryService;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.platform.user.domain.UserMode;
import com.livic.platform.user.facade.UserFacade;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ChargeConfigQueryServiceImpl implements ChargeConfigQueryService {

    private final ChargeConfigRepository chargeConfigRepository;
    private final PropertyFacade propertyFacade;
    private final UserFacade userFacade;

    @Override
    public Page<ChargeConfigResponse> getChargesForProperty(UUID propertyId, boolean includeInactive, UUID userId, Pageable pageable) {
        boolean hasRentConfig = chargeConfigRepository.existsByPropertyIdAndChargeCategory(propertyId, ChargeCategory.RENT);

        if (!hasRentConfig) {
            PropertySummaryDTO propSummary = propertyFacade.getPropertyById(propertyId).orElse(null);
            if (propSummary != null) {
                UserMode activeMode = userFacade.getActiveModeForUser(userId);
                if (activeMode == UserMode.RENTAL) {
                    ChargeConfigTbl systemRentConfig = ChargeConfigMapper.createSystemRentConfig(propSummary.id());
                    chargeConfigRepository.save(systemRentConfig);
                }
            }
        }

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
