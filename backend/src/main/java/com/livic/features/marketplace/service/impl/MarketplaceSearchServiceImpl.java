package com.livic.features.marketplace.service.impl;

import com.livic.platform.common.enums.OwnerModule;
import com.livic.platform.common.exception.BusinessException;
import com.livic.features.marketplace.dto.MarketplacePropertyDTOs;
import com.livic.features.marketplace.dto.MarketplaceUnitDTOs;
import com.livic.features.marketplace.mapper.MarketplacePropertyMapper;
import com.livic.features.marketplace.mapper.MarketplaceUnitMapper;
import com.livic.features.marketplace.qr.QrCodeService;
import com.livic.features.marketplace.service.interfaces.MarketplaceSearchService;
import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.domain.PropertyType;
import com.livic.services.property.domain.UnitTbl;
import com.livic.services.property.repository.PropertyRepository;
import com.livic.services.property.repository.UnitRepository;
import com.livic.platform.storage.domain.MediaAssetTbl;
import com.livic.platform.storage.repository.MediaAssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MarketplaceSearchServiceImpl implements MarketplaceSearchService {

    private final PropertyRepository propertyRepository;
    private final UnitRepository unitRepository;
    private final MediaAssetRepository mediaAssetRepository;
    private final QrCodeService qrCodeService;

    @Value("${app.marketplace.base-url:http://localhost:3000}")
    private String marketplaceBaseUrl;

    @Override
    @Transactional(readOnly = true)
    public Page<MarketplacePropertyDTOs.PropertySummaryResponse> searchProperties(
            String city,
            PropertyType type,
            Pageable pageable
    ) {
        String searchCity = (city != null && !city.isBlank()) ? city.trim() : null;
        Page<PropertyTbl> properties = propertyRepository.searchPublicProperties(searchCity, type, pageable);

        if (properties.isEmpty()) {
            return Page.empty(pageable);
        }

        List<UUID> propertyIds = properties.getContent().stream()
                .map(PropertyTbl::getId)
                .collect(Collectors.toList());

        // Bulk fetch media assets to prevent N+1 queries
        List<MediaAssetTbl> mediaAssets = mediaAssetRepository.findAllByOwnerModuleAndReferenceIdIn(
                OwnerModule.PROPERTY, propertyIds);
        Map<UUID, List<String>> propertyImagesMap = mediaAssets.stream()
                .collect(Collectors.groupingBy(
                        MediaAssetTbl::getReferenceId,
                        Collectors.mapping(MediaAssetTbl::getUrl, Collectors.toList())
                ));

        return properties.map(property -> {
            List<UnitTbl> units = unitRepository.findByPropertyId(property.getId());
            int totalUnitsCount = units.size();

            BigDecimal minPrice = units.stream()
                    .map(UnitTbl::getBasePrice)
                    .filter(price -> price != null && price.compareTo(BigDecimal.ZERO) > 0)
                    .min(BigDecimal::compareTo)
                    .orElse(BigDecimal.ZERO);

            String startingPrice = minPrice.compareTo(BigDecimal.ZERO) > 0
                    ? String.format("₹%,.0f/mo", minPrice)
                    : "Price on Request";

            List<String> images = propertyImagesMap.getOrDefault(property.getId(), Collections.emptyList());

            return MarketplacePropertyMapper.toSummaryResponse(
                    property,
                    images,
                    startingPrice,
                    totalUnitsCount
            );
        });
    }

    @Override
    @Transactional(readOnly = true)
    public MarketplacePropertyDTOs.PropertyDetailResponse getPropertyDetail(UUID propertyId) {
        PropertyTbl property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Property not found with id: " + propertyId));

        if (!property.isPubliclyListed() || !property.isActive()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Property is not publicly listed or is inactive");
        }

        List<MediaAssetTbl> propMedia = mediaAssetRepository.findAllByOwnerModuleAndReferenceId(
                OwnerModule.PROPERTY, propertyId);
        List<String> propertyImages = propMedia.stream().map(MediaAssetTbl::getUrl).collect(Collectors.toList());

        List<UnitTbl> units = unitRepository.findByPropertyId(propertyId);
        List<UUID> unitIds = units.stream().map(UnitTbl::getId).collect(Collectors.toList());

        Map<UUID, List<String>> unitImagesMap = Collections.emptyMap();
        if (!unitIds.isEmpty()) {
            List<MediaAssetTbl> unitMedia = mediaAssetRepository.findAllByOwnerModuleAndReferenceIdIn(
                    OwnerModule.PROPERTY, unitIds);
            unitImagesMap = unitMedia.stream().collect(Collectors.groupingBy(
                    MediaAssetTbl::getReferenceId,
                    Collectors.mapping(MediaAssetTbl::getUrl, Collectors.toList())
            ));
        }

        Map<UUID, List<String>> finalUnitImagesMap = unitImagesMap;
        List<MarketplaceUnitDTOs.UnitSummaryResponse> unitDTOs = units.stream()
                .map(unit -> MarketplaceUnitMapper.toResponse(unit, finalUnitImagesMap.getOrDefault(unit.getId(), Collections.emptyList())))
                .collect(Collectors.toList());

        return MarketplacePropertyMapper.toDetailResponse(property, propertyImages, unitDTOs);
    }

    @Override
    @Transactional(readOnly = true)
    public MarketplaceUnitDTOs.UnitDetailCompositeResponse getUnitDetailComposite(UUID propertyId, UUID unitId) {
        PropertyTbl property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Property not found with id: " + propertyId));

        if (!property.isPubliclyListed() || !property.isActive()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Property is not publicly listed or is inactive");
        }

        UnitTbl unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit not found with id: " + unitId));

        if (!unit.getProperty().getId().equals(propertyId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Unit does not belong to property: " + propertyId);
        }

        // Composite property summary
        List<MediaAssetTbl> propMedia = mediaAssetRepository.findAllByOwnerModuleAndReferenceId(
                OwnerModule.PROPERTY, propertyId);
        List<String> propertyImages = propMedia.stream().map(MediaAssetTbl::getUrl).collect(Collectors.toList());

        List<UnitTbl> allPropUnits = unitRepository.findByPropertyId(propertyId);
        BigDecimal minPrice = allPropUnits.stream()
                .map(UnitTbl::getBasePrice)
                .filter(p -> p != null && p.compareTo(BigDecimal.ZERO) > 0)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        String startingPrice = minPrice.compareTo(BigDecimal.ZERO) > 0
                ? String.format("₹%,.0f/mo", minPrice)
                : "Price on Request";

        MarketplacePropertyDTOs.PropertySummaryResponse propertySummary = MarketplacePropertyMapper.toSummaryResponse(
                property, propertyImages, startingPrice, allPropUnits.size());

        // Unit summary & images
        List<MediaAssetTbl> unitMedia = mediaAssetRepository.findAllByOwnerModuleAndReferenceId(
                OwnerModule.PROPERTY, unitId);
        List<String> unitImages = unitMedia.stream().map(MediaAssetTbl::getUrl).collect(Collectors.toList());

        MarketplaceUnitDTOs.UnitSummaryResponse unitSummary = MarketplaceUnitMapper.toResponse(unit, unitImages);

        return MarketplaceUnitMapper.toCompositeResponse(propertySummary, unitSummary);
    }

    @Override
    @Transactional
    public byte[] getPropertyQrCode(UUID propertyId) {
        PropertyTbl property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Property not found with id: " + propertyId));

        if (property.getQrSlug() == null || property.getQrSlug().isBlank()) {
            String slug = "qr_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            property.setQrSlug(slug);
            propertyRepository.save(property);
        }

        String targetUrl = marketplaceBaseUrl + "/market-place/" + property.getId();
        return qrCodeService.generateQrCodePng(targetUrl, 300, 300);
    }
}
