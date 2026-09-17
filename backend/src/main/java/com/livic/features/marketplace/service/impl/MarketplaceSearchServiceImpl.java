package com.livic.features.marketplace.service.impl;

import com.livic.features.marketplace.dto.MarketplacePropertyDTOs.PropertyDetailResponse;
import com.livic.features.marketplace.dto.MarketplacePropertyDTOs.PropertySummaryResponse;
import com.livic.features.marketplace.dto.MarketplaceUnitDTOs.UnitDetailCompositeResponse;
import com.livic.features.marketplace.dto.MarketplaceUnitDTOs.UnitSummaryResponse;
import com.livic.features.marketplace.mapper.MarketplacePropertyMapper;
import com.livic.features.marketplace.mapper.MarketplaceUnitMapper;
import com.livic.features.marketplace.qr.QrCodeService;
import com.livic.features.marketplace.service.interfaces.MarketplaceSearchService;
import com.livic.platform.common.domain.PropertyType;
import com.livic.platform.common.enums.OwnerModule;
import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.storage.dto.MediaDTOs;
import com.livic.platform.storage.facade.StorageFacade;
import com.livic.services.property.dto.PublicPropertyListingDTO;
import com.livic.services.property.dto.UnitListingDTO;
import com.livic.services.property.facade.PropertyFacade;
import com.livic.services.property.facade.UnitFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MarketplaceSearchServiceImpl implements MarketplaceSearchService {

    private final PropertyFacade propertyFacade;
    private final UnitFacade unitFacade;
    private final StorageFacade storageFacade;
    private final QrCodeService qrCodeService;

    private static final int MAX_UNITS_PAGE_SIZE = 50;

    @Value("${app.marketplace.base-url:http://localhost:3000}")
    private String marketplaceBaseUrl;

    @Override
    @Transactional(readOnly = true)
    public Page<PropertySummaryResponse> searchProperties(
            String city,
            PropertyType type,
            Pageable pageable
    ) {
        String searchCity = (city != null && !city.isBlank()) ? city.trim() : null;
        Page<PublicPropertyListingDTO> properties = propertyFacade.searchPublicListings(searchCity, type, pageable);

        if (properties.isEmpty()) {
            return Page.empty(pageable);
        }

        List<UUID> propertyIds = properties.getContent().stream()
                .map(PublicPropertyListingDTO::id)
                .collect(Collectors.toList());

        // Bulk fetch media and units to prevent N+1 queries
        Map<UUID, List<String>> propertyImagesMap = imageUrlsByReference(propertyIds);
        Map<UUID, List<UnitListingDTO>> unitsByProperty = unitFacade.getUnitListingsByPropertyIds(propertyIds);

        return properties.map(property -> {
            List<UnitListingDTO> units = unitsByProperty.getOrDefault(property.id(), Collections.emptyList());
            List<String> images = propertyImagesMap.getOrDefault(property.id(), Collections.emptyList());

            return MarketplacePropertyMapper.toSummaryResponse(
                    property,
                    images,
                    startingPrice(units),
                    units.size()
            );
        });
    }

    @Override
    @Transactional(readOnly = true)
    public PropertyDetailResponse getPropertyDetail(UUID propertyId) {
        PublicPropertyListingDTO property = getPublicListingOrThrow(propertyId);

        List<String> propertyImages = imageUrls(propertyId);

        // Units are served page by page via getPropertyUnits; only summary figures are needed here
        List<UnitListingDTO> units = unitFacade.getUnitListingsByPropertyId(propertyId);
        int availableUnitsCount = (int) units.stream().filter(UnitListingDTO::bookable).count();

        return MarketplacePropertyMapper.toDetailResponse(
                property, propertyImages, startingPrice(units), units.size(), availableUnitsCount);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UnitSummaryResponse> getPropertyUnits(UUID propertyId, boolean availableOnly, Pageable pageable) {
        getPublicListingOrThrow(propertyId);

        Pageable page = PageRequest.of(pageable.getPageNumber(), Math.min(Math.max(pageable.getPageSize(), 1), MAX_UNITS_PAGE_SIZE));
        Page<UnitListingDTO> units = unitFacade.getUnitListingsByPropertyId(propertyId, availableOnly, page);

        // Fetch images only for the units on this page
        List<UUID> unitIds = units.getContent().stream().map(UnitListingDTO::id).collect(Collectors.toList());
        Map<UUID, List<String>> unitImagesMap = imageUrlsByReference(unitIds);

        return units.map(unit -> MarketplaceUnitMapper.toResponse(unit, unitImagesMap.getOrDefault(unit.id(), Collections.emptyList())));
    }

    @Override
    @Transactional(readOnly = true)
    public UnitDetailCompositeResponse getUnitDetailComposite(UUID propertyId, UUID unitId) {
        PublicPropertyListingDTO property = getPublicListingOrThrow(propertyId);

        UnitListingDTO unit = unitFacade.getUnitListingById(unitId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit not found with id: " + unitId));

        if (!propertyId.equals(unit.propertyId())) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Unit does not belong to property: " + propertyId);
        }

        // Composite property summary
        List<UnitListingDTO> allPropUnits = unitFacade.getUnitListingsByPropertyId(propertyId);
        PropertySummaryResponse propertySummary = MarketplacePropertyMapper.toSummaryResponse(
                property, imageUrls(propertyId), startingPrice(allPropUnits), allPropUnits.size());

        // Unit summary & images
        UnitSummaryResponse unitSummary = MarketplaceUnitMapper.toResponse(unit, imageUrls(unitId));

        return MarketplaceUnitMapper.toCompositeResponse(propertySummary, unitSummary);
    }

    @Override
    @Transactional
    public byte[] getPropertyQrCode(UUID propertyId) {
        propertyFacade.getOrCreateQrSlug(propertyId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Property not found with id: " + propertyId));

        String targetUrl = marketplaceBaseUrl + "/market-place/" + propertyId;
        return qrCodeService.generateQrCodePng(targetUrl, 300, 300);
    }

    private PublicPropertyListingDTO getPublicListingOrThrow(UUID propertyId) {
        return propertyFacade.getPublicListing(propertyId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Property not found or not publicly listed: " + propertyId));
    }

    private List<String> imageUrls(UUID referenceId) {
        return storageFacade.getAssets(OwnerModule.PROPERTY, referenceId).stream()
                .map(MediaDTOs.MediaAssetDTO::url)
                .collect(Collectors.toList());
    }

    private Map<UUID, List<String>> imageUrlsByReference(Collection<UUID> referenceIds) {
        if (referenceIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return storageFacade.getAssetsForReferences(OwnerModule.PROPERTY, referenceIds).entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().stream().map(MediaDTOs.MediaAssetDTO::url).collect(Collectors.toList())
                ));
    }

    private static String startingPrice(List<UnitListingDTO> units) {
        BigDecimal minPrice = units.stream()
                .map(UnitListingDTO::basePrice)
                .filter(price -> price != null && price.compareTo(BigDecimal.ZERO) > 0)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        return minPrice.compareTo(BigDecimal.ZERO) > 0
                ? String.format("₹%,.0f/mo", minPrice)
                : "Price on Request";
    }
}
