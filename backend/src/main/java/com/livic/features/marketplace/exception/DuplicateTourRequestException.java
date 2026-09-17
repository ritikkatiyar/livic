package com.livic.features.marketplace.exception;

import com.livic.features.marketplace.dto.TourRequestDTOs;
import com.livic.platform.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

/** The phone already has an active tour request at this property. */
public class DuplicateTourRequestException extends BusinessException {

    private final transient TourRequestDTOs.ExistingTourRequestSummary existingRequest;

    public DuplicateTourRequestException(TourRequestDTOs.ExistingTourRequestSummary existingRequest) {
        super(HttpStatus.CONFLICT, "You already have an active tour request at this property");
        this.existingRequest = existingRequest;
    }

    /** May be null when the duplicate was detected by the database constraint under a concurrent submission. */
    public TourRequestDTOs.ExistingTourRequestSummary getExistingRequest() {
        return existingRequest;
    }
}
