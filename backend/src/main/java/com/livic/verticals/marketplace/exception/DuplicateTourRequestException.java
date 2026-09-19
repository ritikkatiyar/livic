package com.livic.verticals.marketplace.exception;

import com.livic.verticals.marketplace.dto.TourRequestDTOs.ExistingTourRequestSummary;
import com.livic.platform.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

/** The phone already has an active tour request at this property. */
public class DuplicateTourRequestException extends BusinessException {

    private final transient ExistingTourRequestSummary existingRequest;

    public DuplicateTourRequestException(ExistingTourRequestSummary existingRequest) {
        super(HttpStatus.CONFLICT, "You already have an active tour request at this property");
        this.existingRequest = existingRequest;
    }

    /** May be null when the duplicate was detected by the database constraint under a concurrent submission. */
    public ExistingTourRequestSummary getExistingRequest() {
        return existingRequest;
    }
}
