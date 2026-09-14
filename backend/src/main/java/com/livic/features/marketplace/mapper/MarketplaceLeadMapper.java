package com.livic.features.marketplace.mapper;

import com.livic.features.marketplace.domain.MarketplaceLeadTbl;
import com.livic.features.marketplace.dto.MarketplaceLeadDTOs;

import java.time.Instant;

public final class MarketplaceLeadMapper {

    private MarketplaceLeadMapper() {}

    public static MarketplaceLeadDTOs.LeadResponse toResponse(MarketplaceLeadTbl lead) {
        if (lead == null) {
            return null;
        }

        return new MarketplaceLeadDTOs.LeadResponse(
                lead.getId(),
                lead.getPropertyId(),
                lead.getUnitId(),
                lead.getLeadType(),
                lead.getStatus(),
                lead.getProspectName(),
                lead.getProspectPhone(),
                lead.getProspectEmail(),
                lead.getPreferredSlot(),
                lead.getExpectedMoveInDate(),
                lead.getTokenAmount(),
                lead.getPaymentTransactionId(),
                lead.getConvertedUnitBookingId(),
                lead.getCreatedAt()
        );
    }

    public static MarketplaceLeadDTOs.LeadStatusResponse toStatusResponse(MarketplaceLeadTbl lead, Instant now) {
        if (lead == null) {
            return null;
        }

        return new MarketplaceLeadDTOs.LeadStatusResponse(
                lead.getId(),
                lead.getPropertyId(),
                lead.getUnitId(),
                lead.getLeadType(),
                lead.effectiveStatus(now),
                lead.getPreferredSlot(),
                lead.getTokenAmount(),
                lead.getPaymentTransactionId(),
                lead.getConvertedUnitBookingId(),
                lead.getCreatedAt()
        );
    }
}
