package com.livic.core.finance.service.impl;

import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.core.finance.dto.ChargeConfigRequest;
import com.livic.core.finance.dto.ChargeConfigResponse;
import com.livic.core.finance.mapper.ChargeConfigMapper;
import com.livic.core.finance.service.ChargeConfigService;
import com.livic.core.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.core.finance.service.interfaces.BillingWorksheetCrudService;
import com.livic.core.finance.service.interfaces.MeterReadingCrudService;
import com.livic.core.finance.service.interfaces.RentCycleChargeCrudService;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.platform.common.domain.ChargeCategory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.livic.platform.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class ChargeConfigServiceImpl implements ChargeConfigService {

    private final ChargeConfigCrudService chargeConfigCrudService;
    private final PropertyFacade propertyFacade;
    private final BillingWorksheetCrudService billingWorksheetCrudService;
    private final MeterReadingCrudService meterReadingCrudService;
    private final RentCycleChargeCrudService rentCycleChargeCrudService;

    @Override
    public ChargeConfigResponse createChargeConfig(ChargeConfigRequest request) {
        if (request.getChargeCategory() == ChargeCategory.RENT) {
            throw new BusinessException("Rent is no longer configured here — it's set per lease when the lease is created");
        }
        PropertySummaryDTO propSummary = propertyFacade.getPropertyById(request.getPropertyId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Property not found"));
        ChargeConfigTbl config = ChargeConfigMapper.toEntity(request, propSummary.id());
        chargeConfigCrudService.save(config);
        return ChargeConfigMapper.toResponse(config);
    }

    @Override
    public ChargeConfigResponse updateChargeConfig(UUID id, ChargeConfigRequest request) {
        ChargeConfigTbl config = chargeConfigCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Charge Config not found"));

        if (config.getChargeCategory() != request.getChargeCategory() && 
            (config.getChargeCategory() == ChargeCategory.RENT || request.getChargeCategory() == ChargeCategory.RENT)) {
            throw new BusinessException("Rent is no longer configured here — it's set per lease when the lease is created");
        }

        ChargeConfigMapper.updateEntity(request, config);
        chargeConfigCrudService.save(config);
        return ChargeConfigMapper.toResponse(config);
    }

    @Override
    public void deactivateChargeConfig(UUID id) {
        ChargeConfigTbl config = chargeConfigCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Charge Config not found"));

        if (Boolean.TRUE.equals(config.getIsSystemRequired())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot deactivate a system-required charge configuration.");
        }

        config.setIsActive(false);
        chargeConfigCrudService.save(config);
    }

    @Override
    public void reactivateChargeConfig(UUID id) {
        ChargeConfigTbl config = chargeConfigCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Charge Config not found"));
        config.setIsActive(true);
        chargeConfigCrudService.save(config);
    }

    @Override
    public void deleteChargeConfigPermanently(UUID id) {
        ChargeConfigTbl config = chargeConfigCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Charge Config not found"));

        if (Boolean.TRUE.equals(config.getIsSystemRequired())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot delete a system-required charge configuration.");
        }

        if (billingWorksheetCrudService.existsByChargeConfigId(id) ||
                meterReadingCrudService.existsByChargeConfigId(id) ||
                rentCycleChargeCrudService.existsByCustomChargeConfigId(id)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Cannot permanently delete this charge configuration because it has historical billing records. Please keep it deactivated instead.");
        }

        chargeConfigCrudService.delete(config);
    }


}
