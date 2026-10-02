package com.livic.verticals.rental.booking.facade.impl;

import com.livic.platform.common.exception.BusinessException;
import com.livic.verticals.rental.booking.domain.UnitBookingStatus;
import com.livic.verticals.rental.booking.domain.UnitBookingTbl;
import com.livic.verticals.rental.booking.dto.UnitBookingDTOs.UnitBookingResponse;
import com.livic.verticals.rental.booking.facade.BookingFacade;
import com.livic.verticals.rental.booking.mapper.UnitBookingMapper;
import com.livic.verticals.rental.booking.repository.UnitBookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingFacadeImpl implements BookingFacade {

    private final UnitBookingRepository unitBookingRepository;

    @Override
    @Transactional(readOnly = true)
    public UnitBookingResponse getConvertibleBooking(UUID bookingId) {
        UnitBookingTbl booking = unitBookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit booking not found"));
        if (!UnitBookingStatus.BOOKED.name().equals(booking.getStatus())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Booking is not in BOOKED status");
        }
        if (booking.getPaymentTransactionId() == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Token payment has not been collected for this booking");
        }
        return UnitBookingMapper.toResponse(booking, null);
    }

    @Override
    @Transactional
    public void markConverted(UUID bookingId, UUID leaseId) {
        UnitBookingTbl booking = unitBookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit booking not found"));
        booking.setStatus(UnitBookingStatus.CONVERTED.name());
        booking.setConvertedLeaseId(leaseId);
        unitBookingRepository.save(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<BigDecimal> findConvertedToken(UUID leaseId) {
        return unitBookingRepository.findByStatusAndConvertedLeaseId(UnitBookingStatus.CONVERTED.name(), leaseId)
                .map(UnitBookingTbl::getTokenAmount)
                .filter(token -> token.signum() > 0);
    }
}
