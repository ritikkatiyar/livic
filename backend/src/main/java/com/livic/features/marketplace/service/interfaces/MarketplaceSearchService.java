package com.livic.features.marketplace.service.interfaces;

import com.livic.features.marketplace.dto.MarketplacePropertyDTOs;
import com.livic.features.marketplace.dto.MarketplaceUnitDTOs;
import com.livic.platform.common.domain.PropertyType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface MarketplaceSearchService {

    Page<MarketplacePropertyDTOs.PropertySummaryResponse> searchProperties(
            String city,
            PropertyType type,
            Pageable pageable
    );

    MarketplacePropertyDTOs.PropertyDetailResponse getPropertyDetail(UUID propertyId);

    Page<MarketplaceUnitDTOs.UnitSummaryResponse> getPropertyUnits(UUID propertyId, boolean availableOnly, Pageable pageable);

    MarketplaceUnitDTOs.UnitDetailCompositeResponse getUnitDetailComposite(UUID propertyId, UUID unitId);

    byte[] getPropertyQrCode(UUID propertyId);
}
