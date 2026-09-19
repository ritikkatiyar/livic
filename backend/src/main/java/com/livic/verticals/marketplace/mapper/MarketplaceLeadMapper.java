package com.livic.verticals.marketplace.mapper;

import com.livic.verticals.marketplace.domain.MarketplaceLeadTbl;
import com.livic.verticals.marketplace.dto.MarketplaceLeadDTOs.LeadResponse;
import com.livic.verticals.marketplace.dto.MarketplaceLeadDTOs.LeadStatusResponse;
import java.time.Instant;

public final class MarketplaceLeadMapper {

    private MarketplaceLeadMapper() {}

    public static LeadResponse toResponse(MarketplaceLeadTbl lead) {
        if (lead == null) {
            return null;
        }

        return new LeadResponse(
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

    public static LeadStatusResponse toStatusResponse(MarketplaceLeadTbl lead, Instant now) {
        if (lead == null) {
            return null;
        }

        return new LeadStatusResponse(
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
