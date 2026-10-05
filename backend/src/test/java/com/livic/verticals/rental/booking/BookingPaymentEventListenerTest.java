package com.livic.verticals.rental.booking;

import com.livic.platform.payment.event.PaymentCompletedEvent;
import com.livic.verticals.rental.booking.domain.UnitBookingTbl;
import com.livic.verticals.rental.booking.listener.BookingPaymentEventListener;
import com.livic.verticals.rental.booking.repository.UnitBookingRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** A booking taken by the landlord must show its token as paid, or it can never become a lease. */
@ExtendWith(MockitoExtension.class)
class BookingPaymentEventListenerTest {

    @Mock private UnitBookingRepository unitBookingRepository;

    @InjectMocks private BookingPaymentEventListener listener;

    @Test
    @DisplayName("A paid token is recorded on the booking")
    void recordsTheTokenPayment() {
        UnitBookingTbl booking = booking(BigDecimal.valueOf(2000));
        when(unitBookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        UUID transactionId = UUID.randomUUID();

        listener.handle(payment(booking.getId(), transactionId, BigDecimal.valueOf(2000)));

        assertThat(booking.getPaymentTransactionId()).isEqualTo(transactionId);
        verify(unitBookingRepository).save(booking);
    }

    @Test
    @DisplayName("A payment smaller than the token does not mark the booking paid")
    void partPaymentIsNotEnough() {
        UnitBookingTbl booking = booking(BigDecimal.valueOf(2000));
        when(unitBookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        listener.handle(payment(booking.getId(), UUID.randomUUID(), BigDecimal.valueOf(500)));

        assertThat(booking.getPaymentTransactionId()).isNull();
        verify(unitBookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("Payments for anything else are ignored")
    void ignoresOtherPayments() {
        listener.handle(PaymentCompletedEvent.builder().referenceType("BILL").referenceId(UUID.randomUUID()).build());

        verify(unitBookingRepository, never()).findById(any());
    }

    private static UnitBookingTbl booking(BigDecimal token) {
        UnitBookingTbl booking = new UnitBookingTbl();
        booking.setId(UUID.randomUUID());
        booking.setTokenAmount(token);
        booking.setStatus("BOOKED");
        return booking;
    }

    private static PaymentCompletedEvent payment(UUID bookingId, UUID transactionId, BigDecimal amount) {
        return PaymentCompletedEvent.builder()
                .referenceType("UNIT_BOOKING")
                .referenceId(bookingId)
                .transactionId(transactionId)
                .amount(amount)
                .build();
    }
}
