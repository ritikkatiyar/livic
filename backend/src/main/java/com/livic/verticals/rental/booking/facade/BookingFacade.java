package com.livic.verticals.rental.booking.facade;

import com.livic.verticals.rental.booking.dto.UnitBookingDTOs.UnitBookingResponse;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

/** How the rest of rental reaches bookings: leases convert them, rent bills credit their token. */
public interface BookingFacade {

    /** A booking that can become a lease: still booked, with its token paid. Refused otherwise. */
    UnitBookingResponse getConvertibleBooking(UUID bookingId);

    /** Records that the booking became this lease. */
    void markConverted(UUID bookingId, UUID leaseId);

    /** The token paid for the booking that became this lease, if there was one. */
    Optional<BigDecimal> findConvertedToken(UUID leaseId);
}
