package com.livic.verticals.rental.lease.dto;

import com.livic.verticals.rental.lease.domain.LeaseTbl;

import java.time.LocalDate;
import java.util.UUID;

public record LeaseSummaryDTO(
        UUID id,
        UUID unitId,
        String unitNumber,
        Integer floor,
        UUID propertyId,
        String propertyName,
        UUID userId,
        String status,
        LocalDate moveInDate,
        LocalDate moveOutDate,
        java.math.BigDecimal rentAmount
) {
    public static LeaseSummaryDTO from(LeaseTbl lease, com.livic.core.property.dto.UnitSummaryDTO unit) {
        if (lease == null) {
            return null;
        }
        return new LeaseSummaryDTO(
                lease.getId(),
                lease.getUnitId(),
                unit != null ? unit.unitNumber() : null,
                unit != null ? unit.floor() : null,
                unit != null ? unit.propertyId() : null,
                unit != null ? unit.propertyName() : null,
                lease.getUserId(),
                lease.getStatus() != null ? lease.getStatus().name() : null,
                lease.getMoveInDate(),
                lease.getMoveOutDate(),
                lease.getMonthlyRentAmount()
        );
    }
}
