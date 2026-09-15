package com.livic.features.marketplace.service.interfaces;

import com.livic.features.marketplace.dto.TourRequestDTOs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/** Tour requests as seen by the prospect who made them, identified only by an OTP-verified phone session. */
public interface MyTourRequestService {

    Page<TourRequestDTOs.MyTourRequestResponse> listMyTourRequests(String sessionToken, Pageable pageable);

    TourRequestDTOs.MyTourRequestResponse cancelMyTourRequest(String sessionToken, UUID leadId);

    /** Upcoming slots at a property that the landlord declined for the verified phone (they can't be requested again). */
    TourRequestDTOs.DeclinedTourSlotsResponse listDeclinedSlots(String sessionToken, UUID propertyId);
}
