package com.livic.verticals.rental.lease;

import com.livic.verticals.rental.lease.domain.LeaseSplitStrategy;
import com.livic.verticals.rental.lease.domain.LeaseStatus;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.verticals.rental.lease.dto.LeaseDTOs;
import com.livic.verticals.rental.lease.mapper.LeaseMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LeaseMapperTest {

    @Test
    @DisplayName("The lease keeps its monthly rent from request to response")
    void mapsMonthlyRentAmount() {
        LeaseDTOs.CreateLeaseRequest request = new LeaseDTOs.CreateLeaseRequest(
                UUID.randomUUID(),
                UUID.randomUUID(),
                BigDecimal.valueOf(2500.00),
                BigDecimal.valueOf(5000.00),
                LeaseSplitStrategy.FULL_UNIT,
                LocalDate.now(),
                null,
                LeaseStatus.ACTIVE,
                null
        );

        LeaseTbl entity = LeaseMapper.toEntity(request, request.unitId(), request.userId());
        assertEquals(BigDecimal.valueOf(2500.00), entity.getMonthlyRentAmount());

        LeaseDTOs.LeaseResponse response = LeaseMapper.toResponseWithDetails(entity, "John Doe", "1234567890");
        assertEquals(BigDecimal.valueOf(2500.00), response.monthlyRentAmount());
    }
}
