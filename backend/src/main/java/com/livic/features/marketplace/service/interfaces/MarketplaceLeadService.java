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

    MarketplaceLeadDTOs.LeadResponse getLeadStatus(UUID leadId);

    MarketplaceLeadDTOs.TokenPaymentInitResponse initiateTokenPayment(UUID leadId);
}
