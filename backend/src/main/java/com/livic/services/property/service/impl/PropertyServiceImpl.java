package com.livic.services.property.service.impl;

import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.dto.PropertyDTOs;
import com.livic.services.property.service.interfaces.BlockService;
import com.livic.services.property.service.interfaces.PropertyCrudService;
import com.livic.services.property.service.interfaces.PropertyService;
import com.livic.services.property.mapper.PropertyMapper;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import com.livic.platform.auth.facade.AuthFacade;
import com.livic.services.property.service.interfaces.UnitCrudService;
import com.livic.platform.common.event.PropertyDeletionEvent;
import com.livic.services.property.spi.UnitOccupancyProvider;
import com.livic.platform.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PropertyServiceImpl implements PropertyService {
    private final PropertyCrudService propertyCrudService;
    private final UserFacade userFacade;
    private final AuthFacade authFacade;
    private final UnitCrudService unitCrudService;
    private final BlockService blockService;
    private final ApplicationEventPublisher eventPublisher;
    private final UnitOccupancyProvider unitOccupancyProvider;

    @Override
    public PropertyTbl createProperty(PropertyDTOs.CreatePropertyRequest request, UUID creatorId) {
        UserSummaryDTO creator = userFacade.getUserById(creatorId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));

        PropertyTbl property = PropertyMapper.toEntity(request);
        PropertyTbl savedProperty = propertyCrudService.save(property);
        blockService.getOrCreateDefaultBlock(savedProperty);

        // Assign OWNER role using AuthFacade
        authFacade.createOwnerMembership(savedProperty.getId(), creatorId);
        
        log.info("[PROPERTY] User {} created property: {}", creatorId, savedProperty.getId());
        return savedProperty;
    }

    @Override
    public PropertyTbl updateProperty(UUID propertyId, PropertyDTOs.UpdatePropertyRequest request) {
        PropertyTbl property = propertyCrudService.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        PropertyMapper.updateEntity(request, property);
        return propertyCrudService.save(property);
    }

    @Override
    public void deleteProperty(UUID propertyId) {
        if (unitOccupancyProvider.hasLeasesForProperty(propertyId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot delete property because it has assigned tenants or leases.");
        }

        PropertyTbl property = propertyCrudService.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        
        // Publish synchronous deletion event to let other modules validate/veto/cleanup if necessary
        eventPublisher.publishEvent(new PropertyDeletionEvent(this, propertyId));
        
        unitCrudService.deleteByPropertyId(propertyId);
        blockService.deleteByPropertyId(propertyId);
        propertyCrudService.delete(property);
    }

    @Override
    public PropertyTbl togglePropertyActiveStatus(UUID propertyId, boolean active) {
        PropertyTbl property = propertyCrudService.findById(propertyId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Property not found"));
        property.setActive(active);
        return propertyCrudService.save(property);
    }
}
