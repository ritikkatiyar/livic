package com.livic.verticals.rental.booking.listener;

import com.livic.platform.payment.event.PaymentCompletedEvent;
import com.livic.verticals.rental.booking.domain.UnitBookingTbl;
import com.livic.verticals.rental.booking.repository.UnitBookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Records a booking's token once it is paid, online or in cash. Finance used to receive this
 * payment and only log it, so a booking taken by the landlord never showed its token as paid
 * and could not be turned into a lease.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BookingPaymentEventListener {

    /** What rental calls a booking-token payment; payment hands it back untouched. */
    public static final String REFERENCE_TYPE = "UNIT_BOOKING";

    private final UnitBookingRepository unitBookingRepository;

    @EventListener
    @Transactional
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        if (!REFERENCE_TYPE.equalsIgnoreCase(event.getReferenceType())) {
            return;
        }
        UnitBookingTbl booking = unitBookingRepository.findById(event.getReferenceId()).orElse(null);
        if (booking == null) {
            log.warn("booking_payment_unmatched bookingId={} transactionId={}", event.getReferenceId(), event.getTransactionId());
            return;
        }
        if (booking.getPaymentTransactionId() != null) {
            return;
        }
        if (booking.getTokenAmount() != null && event.getAmount() != null && event.getAmount().compareTo(booking.getTokenAmount()) < 0) {
            log.warn("booking_token_partly_paid bookingId={} paid={} token={}", booking.getId(), event.getAmount(), booking.getTokenAmount());
            return;
        }
        booking.setPaymentTransactionId(event.getTransactionId());
        unitBookingRepository.save(booking);
        log.info("booking_token_paid bookingId={} transactionId={}", booking.getId(), event.getTransactionId());
    }
}
