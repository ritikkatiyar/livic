package com.livic.verticals.marketplace.exception;

import com.livic.platform.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

import java.time.Instant;

/** The requested visit time can't be booked; {@link Reason} tells the prospect why (and the error code the UI reacts to). */
public class TourSlotUnavailableException extends BusinessException {

    public enum Reason {
        /** The landlord already declined this slot for the same phone at this property. */
        DECLINED("TOUR_SLOT_DECLINED", "The property manager declined a visit at this time. Please pick another date or time."),
        /** Every place in the slot is taken by pending or approved requests. */
        FULL("TOUR_SLOT_FULL", "This visit time is fully booked. Please pick another time."),
        /** Not one of the property's visiting slots, in the past or inside the notice period, blocked, or too far ahead. */
        UNAVAILABLE("TOUR_SLOT_UNAVAILABLE", "This visit time is no longer available. Please pick another time.");

        private final String code;
        private final String message;

        Reason(String code, String message) {
            this.code = code;
            this.message = message;
        }

        public String code() {
            return code;
        }
    }

    private final Reason reason;
    private final Instant slot;

    public TourSlotUnavailableException(Reason reason, Instant slot) {
        super(HttpStatus.CONFLICT, reason.message);
        this.reason = reason;
        this.slot = slot;
    }

    public Reason getReason() {
        return reason;
    }

    public Instant getSlot() {
        return slot;
    }
}
