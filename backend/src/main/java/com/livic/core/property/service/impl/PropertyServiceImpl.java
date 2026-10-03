package com.livic.core.property.service.impl;

import com.livic.core.property.repository.BlockRepository;
import com.livic.core.property.repository.UnitRepository;
import com.livic.core.property.repository.PropertyRepository;
import com.livic.core.property.domain.BlockTbl;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.dto.PropertyDTOs;
import com.livic.core.property.service.interfaces.UnitMemberService;
import com.livic.core.property.service.interfaces.BlockService;
import com.livic.core.property.service.interfaces.PropertyService;
import com.livic.core.property.mapper.PropertyMapper;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import com.livic.platform.auth.facade.AuthFacade;
import com.livic.platform.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PropertyServiceImpl implements PropertyService {
    private final PropertyRepository propertyRepository;
    private final UserFacade userFacade;
    private final AuthFacade authFacade;
    private final UnitRepository unitRepository;
    private final BlockService blockService;
    private final BlockRepository blockRepository;
    private final UnitMemberService unitMemberService;

    @Override
    public PropertyDTOs.PropertyResponse createProperty(PropertyDTOs.CreatePropertyRequest request, UUID creatorId) {
        UserSummaryDTO creator = userFacade.getUserById(creatorId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));

        PropertyTbl property = PropertyMapper.toEntity(request);
        PropertyTbl savedProperty = propertyRepository.save(property);
        // Create still takes totalFloors, which now belongs to the building rather than the
        // plot, so it lands on the default block.
        BlockTbl defaultBlock = blockService.getOrCreateDefaultBlock(savedProperty);
        if (request.totalFloors() != null) {
            defaultBlock.setTotalFloors(request.totalFloors());
            blockRepository.save(defaultBlock);
        }

        // Assign OWNER role using AuthFacade
        authFacade.createOwnerMembership(savedProperty.getId(), creatorId);
        
        log.info("[PROPERTY] User {} created property: {}", creatorId, savedProperty.getId());
        return PropertyMapper.toResponse(savedProperty);
    }

    @Override
    public PropertyDTOs.PropertyResponse updateProperty(UUID propertyId, PropertyDTOs.UpdatePropertyRequest request) {
        PropertyTbl property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        PropertyMapper.updateEntity(request, property);
        if (request.totalFloors() != null) {
            BlockTbl defaultBlock = blockService.getOrCreateDefaultBlock(property);
            defaultBlock.setTotalFloors(request.totalFloors());
            blockRepository.save(defaultBlock);
        }
        return PropertyMapper.toResponse(propertyRepository.save(property));
    }

    @Override
    public void deleteProperty(UUID propertyId) {
        // Every tenant, owner and family member is a unit member, and bills and agreements hang
        // off the member row, so a property that has ever had members keeps its history.
        if (unitMemberService.propertyHasEverHadMembers(propertyId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "Cannot delete property because its units have, or have had, residents.");
        }

        PropertyTbl property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        
        // Staff access to the property goes with it.
        authFacade.removeMembershipsForProperty(propertyId);
        
        unitRepository.deleteByPropertyId(propertyId);
        blockService.deleteByPropertyId(propertyId);
        propertyRepository.delete(property);
    }

    @Override
    public PropertyDTOs.PropertyResponse togglePropertyActiveStatus(UUID propertyId, boolean active) {
        PropertyTbl property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Property not found"));
        property.setActive(active);
        return PropertyMapper.toResponse(propertyRepository.save(property));
    }

}
