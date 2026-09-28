package com.livic.core.property.service.impl;

import com.livic.core.property.repository.PropertyRepository;
import com.livic.platform.auth.dto.MembershipSummaryDTO;
import com.livic.platform.auth.facade.AuthFacade;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.dto.PropertyDTOs;
import com.livic.core.property.mapper.PropertyMapper;
import com.livic.core.property.service.interfaces.PropertyQueryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class PropertyQueryServiceImpl implements PropertyQueryService {

    private final PropertyRepository propertyRepository;
    private final AuthFacade authFacade;

    public PropertyQueryServiceImpl(PropertyRepository propertyRepository, AuthFacade authFacade) {
        this.propertyRepository = propertyRepository;
        this.authFacade = authFacade;
    }

    @Override
    public Page<PropertyTbl> getPropertiesByUserId(UUID userId, Pageable pageable) {
        return findPropertiesByUserId(userId, null, pageable);
    }

    @Override
    public Page<PropertyDTOs.PropertyResponse> getMyProperties(UUID userId, String search, Pageable pageable) {
        return findPropertiesByUserId(userId, search, pageable).map(PropertyMapper::toResponse);
    }

    private Page<PropertyTbl> findPropertiesByUserId(UUID userId, String search, Pageable pageable) {
        List<MembershipSummaryDTO> memberships = authFacade.getMembershipsByUserId(userId);
        List<UUID> propertyIds = memberships.stream()
                .filter(MembershipSummaryDTO::isActive)
                .map(MembershipSummaryDTO::propertyId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (propertyIds.isEmpty()) {
            return Page.empty(pageable);
        }
        if (search == null || search.trim().isEmpty()) {
            return propertyRepository.findDistinctByIdIn(propertyIds, pageable);
        }
        return propertyRepository.findDistinctByIdInAndSearch(propertyIds, search, pageable);
    }

    @Override
    public List<PropertyTbl> getPropertiesByUserId(UUID userId) {
        List<MembershipSummaryDTO> memberships = authFacade.getMembershipsByUserId(userId);
        List<UUID> propertyIds = memberships.stream()
                .filter(MembershipSummaryDTO::isActive)
                .map(MembershipSummaryDTO::propertyId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        return getPropertiesByIds(propertyIds);
    }

    @Override
    public List<PropertyTbl> getPropertiesByIds(Collection<UUID> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return List.of();
        }
        return propertyRepository.findDistinctByIdIn(propertyIds);
    }

    @Override
    public PropertyTbl getPropertyById(UUID propertyId) {
        return propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
    }

    @Override
    public PropertyDTOs.PropertyResponse getProperty(UUID propertyId) {
        return PropertyMapper.toResponse(getPropertyById(propertyId));
    }

    @Override
    public boolean existsById(UUID propertyId) {
        return propertyRepository.existsById(propertyId);
    }

    @Override
    public List<PropertyTbl> getPropertiesByAutoBillDayOfMonth(int day) {
        return propertyRepository.findByAutoBillDayOfMonth(day);
    }
}
