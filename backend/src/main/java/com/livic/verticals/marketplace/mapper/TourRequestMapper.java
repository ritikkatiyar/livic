package com.livic.verticals.marketplace.mapper;

import com.livic.verticals.marketplace.domain.MarketplaceLeadTbl;
import com.livic.verticals.marketplace.dto.TourRequestDTOs.LandlordTourRequestResponse;
import com.livic.verticals.marketplace.dto.TourRequestDTOs.MyTourRequestResponse;
import com.livic.verticals.marketplace.slots.TourSchedule;
import com.livic.verticals.marketplace.slots.TourSlotCalculator;
import com.livic.core.property.dto.PropertySummaryDTO;

import java.time.Instant;

public final class TourRequestMapper {

    private TourRequestMapper() {}

    /**
     * @param visitingHours the property's current schedule; an active request outside it is flagged so the landlord
     *                      can decide what to do (requests are never cancelled automatically when hours change)
     */
    public static LandlordTourRequestResponse toLandlordResponse(
            MarketplaceLeadTbl lead, String unitNumber, TourSchedule visitingHours, Instant now) {
        boolean outsideVisitingHours = lead.isActiveTour(now)
                && !TourSlotCalculator.isWithinVisitingHours(visitingHours, lead.getPreferredSlot());
        return new LandlordTourRequestResponse(
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
                lead.getCreatedAt(),
                outsideVisitingHours
        );
    }

    public static MyTourRequestResponse toMyResponse(
            MarketplaceLeadTbl lead,
            PropertySummaryDTO property,
            String unitNumber,
            Instant now
    ) {
        return new MyTourRequestResponse(
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
