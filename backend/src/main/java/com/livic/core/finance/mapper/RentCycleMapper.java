package com.livic.core.finance.mapper;

import com.livic.core.finance.domain.RentCycleChargeTbl;
import com.livic.core.finance.domain.RentCycleTbl;
import com.livic.core.finance.dto.RentCycleDTOs;

import java.util.List;

public final class RentCycleMapper {
    private RentCycleMapper() {
    }

    public static RentCycleDTOs.RentCycleResponse toResponse(
            RentCycleTbl cycle,
            String tenantName,
            String unitNumber,
            List<RentCycleChargeTbl> charges
    ) {
        return new RentCycleDTOs.RentCycleResponse(
                cycle.getId(),
                cycle.getLease().getId(),
                tenantName,
                unitNumber,
                cycle.getBillingMonth(),
                cycle.getTotalAmount(),
                cycle.getDueDate(),
                cycle.getStatus(),
                cycle.getPaidAt(),
                cycle.getCreatedAt(),
                cycle.getUpdatedAt(),
                charges.stream().map(RentCycleMapper::toResponse).toList()
        );
    }

    public static RentCycleDTOs.ChargeResponse toResponse(RentCycleChargeTbl charge) {
        return new RentCycleDTOs.ChargeResponse(
                charge.getId(),
                charge.getChargeType(),
                charge.getAmount(),
                charge.getDescription(),
                charge.getCreatedAt()
        );
    }
}
