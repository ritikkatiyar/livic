package com.livic.core.property.service.interfaces;

import com.livic.platform.common.service.interfaces.CrudService;
import com.livic.core.property.domain.PropertyJoinCodeTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PropertyJoinCodeCrudService extends CrudService<PropertyJoinCodeTbl, UUID> {
    Optional<PropertyJoinCodeTbl> findByCode(String code);
    List<PropertyJoinCodeTbl> findByPropertyId(UUID propertyId);
    Page<PropertyJoinCodeTbl> findByPropertyId(UUID propertyId, Pageable pageable);
}
