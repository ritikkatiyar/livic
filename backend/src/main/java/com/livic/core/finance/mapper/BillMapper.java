package com.livic.core.finance.mapper;

import com.livic.core.finance.domain.BillLineTbl;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.dto.BillDTOs;

import java.util.List;
import java.util.UUID;

public final class BillMapper {
    private BillMapper() {
    }

    public static BillDTOs.BillResponse toResponse(
            BillTbl cycle,
            UUID leaseId,
            UUID blockId,
            String blockName,
            String tenantName,
            String unitNumber,
            List<BillLineTbl> charges
    ) {
        return new BillDTOs.BillResponse(
                cycle.getId(),
                leaseId,
                blockId,
                blockName,
                tenantName,
                unitNumber,
                cycle.getBillingMonth(),
                cycle.getTotalAmount(),
                cycle.getDueDate(),
                cycle.getStatus(),
                cycle.getPaidAt(),
                cycle.getCreatedAt(),
                cycle.getUpdatedAt(),
                charges.stream().map(BillMapper::toResponse).toList()
        );
    }

    public static BillDTOs.ChargeResponse toResponse(BillLineTbl charge) {
        return new BillDTOs.ChargeResponse(
                charge.getId(),
                charge.getChargeType(),
                charge.getAmount(),
                charge.getDescription(),
                charge.getCreatedAt()
        );
    }
}
