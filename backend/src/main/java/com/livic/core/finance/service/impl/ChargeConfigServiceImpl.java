package com.livic.core.finance.service.impl;

import com.livic.core.finance.repository.MeterReadingRepository;
import com.livic.core.finance.repository.ChargeConfigRepository;
import com.livic.core.finance.repository.BillLineRepository;
import com.livic.core.finance.repository.BillingWorksheetRepository;
import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.core.finance.dto.ChargeConfigRequest;
import com.livic.core.finance.dto.ChargeConfigResponse;
import com.livic.core.finance.mapper.ChargeConfigMapper;
import com.livic.core.finance.service.interfaces.ChargeConfigService;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.finance.domain.ChargeCategory;
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

    private final ChargeConfigRepository chargeConfigRepository;
    private final PropertyFacade propertyFacade;
    private final BillingWorksheetRepository billingWorksheetRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final BillLineRepository billLineRepository;

    @Override
    public ChargeConfigResponse createChargeConfig(ChargeConfigRequest request) {
        if (request.getChargeCategory() == ChargeCategory.RENT) {
            throw new BusinessException("Rent is no longer configured here — it's set per lease when the lease is created");
        }
        PropertySummaryDTO propSummary = propertyFacade.getPropertyById(request.getPropertyId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Property not found"));
        ChargeConfigTbl config = ChargeConfigMapper.toEntity(request, propSummary.id());
        chargeConfigRepository.save(config);
        return ChargeConfigMapper.toResponse(config);
    }

    @Override
    public ChargeConfigResponse updateChargeConfig(UUID id, ChargeConfigRequest request) {
        ChargeConfigTbl config = chargeConfigRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Charge Config not found"));

        if (config.getChargeCategory() != request.getChargeCategory() && 
            (config.getChargeCategory() == ChargeCategory.RENT || request.getChargeCategory() == ChargeCategory.RENT)) {
            throw new BusinessException("Rent is no longer configured here — it's set per lease when the lease is created");
        }

        ChargeConfigMapper.updateEntity(request, config);
        chargeConfigRepository.save(config);
        return ChargeConfigMapper.toResponse(config);
    }

    @Override
    public void deactivateChargeConfig(UUID id) {
        ChargeConfigTbl config = chargeConfigRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Charge Config not found"));

        if (Boolean.TRUE.equals(config.getIsSystemRequired())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot deactivate a system-required charge configuration.");
        }

        config.setIsActive(false);
        chargeConfigRepository.save(config);
    }

    @Override
    public void reactivateChargeConfig(UUID id) {
        ChargeConfigTbl config = chargeConfigRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Charge Config not found"));
        config.setIsActive(true);
        chargeConfigRepository.save(config);
    }

    @Override
    public void deleteChargeConfigPermanently(UUID id) {
        ChargeConfigTbl config = chargeConfigRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Charge Config not found"));

        if (Boolean.TRUE.equals(config.getIsSystemRequired())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot delete a system-required charge configuration.");
        }

        if (billingWorksheetRepository.existsByChargeConfigId(id) ||
                meterReadingRepository.existsByChargeConfigId(id) ||
                billLineRepository.existsByCustomChargeConfigId(id)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Cannot permanently delete this charge configuration because it has historical billing records. Please keep it deactivated instead.");
        }

        chargeConfigRepository.delete(config);
    }


}
