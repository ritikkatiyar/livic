package com.livic.features.marketplace.service.interfaces;

import com.livic.features.marketplace.dto.TourRequestDTOs.LandlordTourRequestResponse;
import com.livic.features.marketplace.dto.TourRequestDTOs.TourRequestFilter;
import com.livic.features.marketplace.dto.TourRequestDTOs.TourRequestSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/** Tour requests as managed by property staff. Callers must already be authorized to view the property. */
public interface TourRequestManagementService {

    Page<LandlordTourRequestResponse> listTourRequests(
            UUID propertyId,
            TourRequestFilter filter,
            Pageable pageable
    );

    TourRequestSummaryResponse getSummary(UUID propertyId);

    /** Approves a pending tour request; checks LEASE_UPDATE on the request's property. */
    LandlordTourRequestResponse approve(UUID leadId, UUID landlordUserId);

    /** Rejects a pending tour request with an optional note for the prospect; checks LEASE_UPDATE on the property. */
    LandlordTourRequestResponse reject(UUID leadId, UUID landlordUserId, String note);

    /**
     * Closes every tour whose visit time has passed: pending ones expire, approved ones complete. This releases the
     * one-active-tour-per-property rule for those phones. Returns the number of tours closed.
     */
    int closePastTourRequests();
}
