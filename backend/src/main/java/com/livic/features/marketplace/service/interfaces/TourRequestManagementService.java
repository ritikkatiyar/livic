package com.livic.features.marketplace.service.interfaces;

import com.livic.features.marketplace.dto.TourRequestDTOs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/** Tour requests as managed by property staff. Callers must already be authorized to view the property. */
public interface TourRequestManagementService {

    Page<TourRequestDTOs.LandlordTourRequestResponse> listTourRequests(
            UUID propertyId,
            TourRequestDTOs.TourRequestFilter filter,
            Pageable pageable
    );

    TourRequestDTOs.TourRequestSummaryResponse getSummary(UUID propertyId);

    /** Approves a pending tour request; checks LEASE_UPDATE on the request's property. */
    TourRequestDTOs.LandlordTourRequestResponse approve(UUID leadId, UUID landlordUserId);

    /** Rejects a pending tour request with an optional note for the prospect; checks LEASE_UPDATE on the property. */
    TourRequestDTOs.LandlordTourRequestResponse reject(UUID leadId, UUID landlordUserId, String note);
}
