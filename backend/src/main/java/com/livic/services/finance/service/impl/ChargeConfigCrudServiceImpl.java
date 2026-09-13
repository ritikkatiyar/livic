package com.livic.services.finance.service.impl;

import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.services.finance.domain.ChargeConfigTbl;
import com.livic.services.finance.repository.ChargeConfigRepository;
import com.livic.services.finance.service.interfaces.ChargeConfigCrudService;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.livic.platform.common.domain.ChargeCategory;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ChargeConfigCrudServiceImpl extends AbstractCrudService<ChargeConfigTbl, UUID, ChargeConfigRepository> implements ChargeConfigCrudService {

    public ChargeConfigCrudServiceImpl(ChargeConfigRepository repository) {
        super(repository);
    }

    @Override
    public List<ChargeConfigTbl> findAllByPropertyIdAndIsActiveTrue(UUID propertyId) {
        return repository.findAllByPropertyIdAndIsActiveTrue(propertyId);
    }

    @Override
    public List<ChargeConfigTbl> findAllByPropertyId(UUID propertyId) {
        return repository.findAllByPropertyId(propertyId);
    }

    @Override
    public Page<ChargeConfigTbl> findAllByPropertyIdAndIsActiveTrue(UUID propertyId, Pageable pageable) {
        return repository.findAllByPropertyIdAndIsActiveTrue(propertyId, pageable);
    }

    @Override
    public Page<ChargeConfigTbl> findAllByPropertyId(UUID propertyId, Pageable pageable) {
        return repository.findAllByPropertyId(propertyId, pageable);
    }

    @Override
    public boolean existsByPropertyIdAndChargeCategory(UUID propertyId, ChargeCategory chargeCategory) {
        return repository.existsByPropertyIdAndChargeCategory(propertyId, chargeCategory);
    }

    @Override
    public Optional<ChargeConfigTbl> findByIdAndIsActiveTrue(UUID id) {
        return repository.findByIdAndIsActiveTrue(id);
    }
}
