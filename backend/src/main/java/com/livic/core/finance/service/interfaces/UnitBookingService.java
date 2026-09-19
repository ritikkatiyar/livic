package com.livic.core.finance.service.interfaces;

import com.livic.core.finance.dto.UnitBookingDTOs;
import com.livic.platform.payment.dto.PaymentTransactionResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.UUID;

public interface UnitBookingService {
    UnitBookingDTOs.UnitBookingResponse createBooking(UnitBookingDTOs.CreateBookingRequest request);
    UnitBookingDTOs.UnitBookingResponse forfeitBooking(UUID bookingId, UUID userDetailsId);
    UnitBookingDTOs.UnitBookingResponse refundBooking(UUID bookingId, UUID userDetailsId);
    PaymentTransactionResponse initiateTokenOnlinePayment(UUID bookingId, UUID userDetailsId);
    PaymentTransactionResponse recordTokenCashPayment(UUID bookingId, BigDecimal amount, String note, UUID userDetailsId);
    Page<UnitBookingDTOs.UnitBookingResponse> listBookings(UUID currentUserId, UUID propertyId, Pageable pageable);
}
