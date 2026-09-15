package com.livic.features.marketplace.exception;

import com.livic.platform.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

import java.time.Instant;

/** The landlord already declined this phone's visit at this property for the requested slot. */
public class DeclinedTourSlotException extends BusinessException {

    public static final String CODE = "TOUR_SLOT_DECLINED";

    private final Instant declinedSlot;

    public DeclinedTourSlotException(Instant declinedSlot) {
        super(HttpStatus.CONFLICT, "The property manager declined a visit at this time. Please pick another date or time.");
        this.declinedSlot = declinedSlot;
    }

    public Instant getDeclinedSlot() {
        return declinedSlot;
    }
}
