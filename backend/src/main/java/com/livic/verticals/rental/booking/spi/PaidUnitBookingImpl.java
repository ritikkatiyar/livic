package com.livic.verticals.rental.booking.spi;

import com.livic.core.property.spi.PaidUnitBooking;
import com.livic.verticals.rental.booking.dto.UnitBookingDTOs.PaidBookingRequest;
import com.livic.verticals.rental.booking.mapper.UnitBookingMapper;
import com.livic.verticals.rental.booking.repository.UnitBookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/** A prospect paid a token on the marketplace; rental records it as a booking of the unit. */
@Component
@RequiredArgsConstructor
public class PaidUnitBookingImpl implements PaidUnitBooking {

    private final UnitBookingRepository unitBookingRepository;

    @Override
    @Transactional
    public UUID bookPaidUnit(Request request) {
        return unitBookingRepository.save(UnitBookingMapper.toEntity(new PaidBookingRequest(
                request.unitId(),
                request.name(),
                request.phone(),
                request.email(),
                request.tokenAmount(),
                request.expectedMoveInDate(),
                request.paymentTransactionId()
        ))).getId();
    }
}
