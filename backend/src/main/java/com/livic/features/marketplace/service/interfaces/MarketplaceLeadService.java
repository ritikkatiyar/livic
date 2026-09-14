package com.livic.features.marketplace.service.interfaces;

import com.livic.features.marketplace.dto.MarketplaceLeadDTOs;

import java.util.UUID;

public interface MarketplaceLeadService {

    MarketplaceLeadDTOs.LeadResponse createLead(
            UUID propertyId,
            UUID unitId,
            MarketplaceLeadDTOs.CreateLeadRequest request,
            String sessionToken
    );

    /** Public status lookup by lead id; never includes the prospect's contact details. */
    MarketplaceLeadDTOs.LeadStatusResponse getLeadStatus(UUID leadId);

    MarketplaceLeadDTOs.TokenPaymentInitResponse initiateTokenPayment(UUID leadId);
}
