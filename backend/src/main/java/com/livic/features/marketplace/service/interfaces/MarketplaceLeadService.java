package com.livic.features.marketplace.service.interfaces;

import com.livic.features.marketplace.dto.MarketplaceLeadDTOs.CreateLeadRequest;
import com.livic.features.marketplace.dto.MarketplaceLeadDTOs.LeadResponse;
import com.livic.features.marketplace.dto.MarketplaceLeadDTOs.LeadStatusResponse;
import com.livic.features.marketplace.dto.MarketplaceLeadDTOs.TokenPaymentInitResponse;
import java.util.UUID;

public interface MarketplaceLeadService {

    LeadResponse createLead(
            UUID propertyId,
            UUID unitId,
            CreateLeadRequest request,
            String sessionToken
    );

    /** Public status lookup by lead id; never includes the prospect's contact details. */
    LeadStatusResponse getLeadStatus(UUID leadId);

    TokenPaymentInitResponse initiateTokenPayment(UUID leadId);
}
