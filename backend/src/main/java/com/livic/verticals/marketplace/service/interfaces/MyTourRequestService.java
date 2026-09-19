package com.livic.verticals.marketplace.service.interfaces;

import com.livic.verticals.marketplace.dto.TourRequestDTOs.MyTourRequestResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/** Tour requests as seen by the prospect who made them, identified only by an OTP-verified phone session. */
public interface MyTourRequestService {

    Page<MyTourRequestResponse> listMyTourRequests(String sessionToken, Pageable pageable);

    MyTourRequestResponse cancelMyTourRequest(String sessionToken, UUID leadId);

}
