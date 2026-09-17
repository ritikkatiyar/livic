package com.livic.features.marketplace.exception;

import com.livic.platform.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

/**
 * A tour request can't make the requested transition from its current state (already decided, cancelled, or the
 * visit time has passed). Thrown by the domain entity, which stays free of web concerns; answered as 409 Conflict.
 */
public class TourRequestStateException extends BusinessException {

    public TourRequestStateException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
