package com.livic.verticals.rental.lease.mapper;

import com.livic.platform.common.domain.LeaseStatus;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.verticals.rental.lease.dto.LeaseDTOs;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.platform.user.dto.UserSummaryDTO;

import java.util.UUID;

public final class LeaseMapper {
    private LeaseMapper() {
    }

    public static LeaseTbl toEntity(LeaseDTOs.CreateLeaseRequest request, UUID unitId, UUID targetUserId) {
        return LeaseTbl.builder()
                .userId(targetUserId)
                .unitId(unitId)
                .monthlyRentAmount(request.monthlyRentAmount())
                .securityDeposit(request.securityDeposit())
                .splitStrategy(request.splitStrategy())
                .moveInDate(request.moveInDate())
                .moveOutDate(request.moveOutDate())
                .status(request.status() != null ? request.status() : LeaseStatus.ACTIVE)
                .build();
    }

    public static LeaseDTOs.LeaseResponse toResponse(LeaseTbl lease) {
        return toResponse(lease, null, null, null, null);
    }

    public static LeaseDTOs.LeaseResponse toResponse(
            LeaseTbl lease,
            UnitSummaryDTO unit,
            PropertySummaryDTO property,
            UserSummaryDTO user
    ) {
        String unitNumber = (unit != null && unit.unitNumber() != null && !unit.unitNumber().isBlank())
                ? unit.unitNumber()
                : "N/A";
        String propertyName = (property != null && property.name() != null && !property.name().isBlank())
                ? property.name()
                : ((unit != null && unit.propertyName() != null && !unit.propertyName().isBlank())
                        ? unit.propertyName()
                        : "N/A");
        String tenantName = (user != null && user.fullName() != null && !user.fullName().isBlank())
                ? user.fullName()
                : "Unknown User";
        String tenantPhone = (user != null && user.phoneNumber() != null)
                ? user.phoneNumber()
                : "";
        return toResponse(lease, unitNumber, propertyName, tenantName, tenantPhone);
    }

    public static LeaseDTOs.LeaseResponse toResponse(LeaseTbl lease, String unitNumber, String propertyName, String tenantName, String tenantPhone) {
        return new LeaseDTOs.LeaseResponse(
                lease.getId(),
                lease.getUserId(),
                lease.getUnitId(),
                unitNumber,
                propertyName,
                tenantName,
                tenantPhone,
                lease.getMonthlyRentAmount(),
                lease.getSecurityDeposit(),
                lease.getSplitStrategy(),
                lease.getMoveInDate(),
                lease.getMoveOutDate(),
                lease.getStatus(),
                lease.getCreatedAt(),
                lease.getUpdatedAt()
        );
    }

    public static LeaseDTOs.LeaseResponse toResponseWithDetails(LeaseTbl lease, String tenantName, String tenantPhone) {
        return toResponse(lease, null, null, tenantName, tenantPhone);
    }
}
