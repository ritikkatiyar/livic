package com.livic.features.marketplace.mapper;

import com.livic.features.marketplace.domain.MarketplaceLeadTbl;
import com.livic.features.marketplace.dto.MarketplaceLeadDTOs;

public final class MarketplaceLeadMapper {

    private MarketplaceLeadMapper() {}

    public static MarketplaceLeadDTOs.LeadResponse toResponse(MarketplaceLeadTbl lead) {
        if (lead == null) {
            return null;
        }

        return new MarketplaceLeadDTOs.LeadResponse(
                lead.getId(),
                lead.getProperty() != null ? lead.getProperty().getId() : null,
                lead.getUnit() != null ? lead.getUnit().getId() : null,
                lead.getLeadType(),
                lead.getStatus(),
                lead.getProspectName(),
                lead.getProspectPhone(),
                lead.getProspectEmail(),
                lead.getPreferredSlot(),
                lead.getExpectedMoveInDate(),
                lead.getTokenAmount(),
                lead.getPaymentTransaction() != null ? lead.getPaymentTransaction().getId() : null,
                lead.getConvertedUnitBooking() != null ? lead.getConvertedUnitBooking().getId() : null,
                lead.getCreatedAt()
        );
    }
}
