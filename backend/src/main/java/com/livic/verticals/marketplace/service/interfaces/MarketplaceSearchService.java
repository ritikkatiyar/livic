package com.livic.verticals.marketplace.service.interfaces;

import com.livic.verticals.marketplace.dto.MarketplacePropertyDTOs.PropertyDetailResponse;
import com.livic.verticals.marketplace.dto.MarketplacePropertyDTOs.PropertySummaryResponse;
import com.livic.verticals.marketplace.dto.MarketplaceUnitDTOs.UnitDetailCompositeResponse;
import com.livic.verticals.marketplace.dto.MarketplaceUnitDTOs.UnitSummaryResponse;
import com.livic.platform.common.domain.PropertyType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface MarketplaceSearchService {

    Page<PropertySummaryResponse> searchProperties(
            String city,
            PropertyType type,
            Pageable pageable
    );

    PropertyDetailResponse getPropertyDetail(UUID propertyId);

    Page<UnitSummaryResponse> getPropertyUnits(UUID propertyId, boolean availableOnly, Pageable pageable);

    UnitDetailCompositeResponse getUnitDetailComposite(UUID propertyId, UUID unitId);

    byte[] getPropertyQrCode(UUID propertyId);
}
