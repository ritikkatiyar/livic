package com.livic.core.property.spi;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Holds a unit for someone who has paid a token for it. Declared here and implemented by the
 * vertical that owns bookings (rental), so the marketplace can book a unit without depending on
 * rental.
 */
public interface PaidUnitBooking {

    /** Records the paid booking and returns its id. */
    UUID bookPaidUnit(Request request);

    /**
     * @param paymentTransactionId the token payment that secured the booking
     */
    record Request(
            UUID unitId,
            String name,
            String phone,
            String email,
            BigDecimal tokenAmount,
            LocalDate expectedMoveInDate,
            UUID paymentTransactionId
    ) {
    }
}
