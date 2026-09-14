package com.livic.features.marketplace.mapper;

import com.livic.features.marketplace.domain.MarketplaceLeadTbl;
import com.livic.features.marketplace.dto.TourRequestDTOs;
import com.livic.services.property.dto.PropertySummaryDTO;

import java.time.Instant;

public final class TourRequestMapper {

    private TourRequestMapper() {}

    public static TourRequestDTOs.LandlordTourRequestResponse toLandlordResponse(MarketplaceLeadTbl lead, String unitNumber, Instant now) {
        return new TourRequestDTOs.LandlordTourRequestResponse(
                lead.getId(),
                lead.getPropertyId(),
                lead.getUnitId(),
                unitNumber,
                lead.getProspectName(),
                lead.getProspectPhone(),
                lead.getProspectEmail(),
                lead.getPreferredSlot(),
                lead.effectiveStatus(now),
                lead.getDecisionNote(),
                lead.getDecidedAt(),
                lead.getCreatedAt()
        );
    }

    public static TourRequestDTOs.MyTourRequestResponse toMyResponse(
            MarketplaceLeadTbl lead,
            PropertySummaryDTO property,
            String unitNumber,
            Instant now
    ) {
        return new TourRequestDTOs.MyTourRequestResponse(
                lead.getId(),
                lead.getPropertyId(),
                property != null ? property.name() : null,
                property != null ? property.address() : null,
                property != null ? property.city() : null,
                lead.getUnitId(),
                unitNumber,
                lead.getPreferredSlot(),
                lead.effectiveStatus(now),
                lead.getDecisionNote(),
                lead.getDecidedAt(),
                lead.isActiveTour(now),
                lead.getCreatedAt()
        );
    }
}
