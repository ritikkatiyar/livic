package com.livic.verticals.rental.booking.listener;

import com.livic.platform.outbox.spi.OutboxConsumer;
import com.livic.platform.payment.event.PaymentCompletedEvent;
import com.livic.verticals.rental.booking.domain.UnitBookingTbl;
import com.livic.verticals.rental.booking.repository.UnitBookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Records a booking's token once it is paid, online or in cash. Finance used to receive this
 * payment and only log it, so a booking taken by the landlord never showed its token as paid
 * and could not be turned into a lease.
 */
@Component
@RequiredArgsConstructor
@Slf4j
/** Records a booking token payment once it is committed. */
public class BookingPaymentEventListener implements OutboxConsumer<PaymentCompletedEvent> {

    /** What rental calls a booking-token payment; payment hands it back untouched. */
    public static final String REFERENCE_TYPE = "UNIT_BOOKING";

    private final UnitBookingRepository unitBookingRepository;

    @Override
    public String name() {
        return "rental.booking-payment";
    }

    @Override
    public Class<PaymentCompletedEvent> eventType() {
        return PaymentCompletedEvent.class;
    }

    @Override
    public boolean accepts(PaymentCompletedEvent event) {
        return REFERENCE_TYPE.equalsIgnoreCase(event.referenceType());
    }

    @Override
    public void handle(PaymentCompletedEvent event) {
        if (!REFERENCE_TYPE.equalsIgnoreCase(event.referenceType())) {
            return;
        }
        UnitBookingTbl booking = unitBookingRepository.findById(event.referenceId()).orElse(null);
        if (booking == null) {
            log.warn("booking_payment_unmatched bookingId={} transactionId={}", event.referenceId(), event.transactionId());
            return;
        }
        if (booking.getPaymentTransactionId() != null) {
            return;
        }
        if (booking.getTokenAmount() != null && event.amount() != null && event.amount().compareTo(booking.getTokenAmount()) < 0) {
            log.warn("booking_token_partly_paid bookingId={} paid={} token={}", booking.getId(), event.amount(), booking.getTokenAmount());
            return;
        }
        booking.setPaymentTransactionId(event.transactionId());
        unitBookingRepository.save(booking);
        log.info("booking_token_paid bookingId={} transactionId={}", booking.getId(), event.transactionId());
    }
}
