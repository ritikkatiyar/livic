package com.livic.core.finance.facade;

import com.livic.core.finance.dto.ChargeConfigResponse;
import com.livic.core.finance.dto.UnitBookingDTOs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface FinanceFacade {

    Optional<UUID> getPropertyIdByBillId(UUID billId);

    /** The lease a bill's payer is on, for the rental vertical's own scope resolution. */
    Optional<UUID> getLeaseIdByBillId(UUID billId);

    ChargeConfigResponse getChargeConfigById(UUID chargeConfigId);

    // Analytics Read Methods
    record RevenueMetricsDTO(BigDecimal expected, BigDecimal collected) {}

    record DefaulterRecordDTO(UUID tenantId, String unitNumber, String propertyName, UUID blockId, String blockName, LocalDate dueDate, BigDecimal amountDue, UUID billId) {}

    RevenueMetricsDTO getRevenueMetrics(List<UUID> propertyIds, String billingMonth);

    List<DefaulterRecordDTO> getDefaulters(List<UUID> propertyIds);

    Page<DefaulterRecordDTO> getDefaulters(List<UUID> propertyIds, Pageable pageable);

    BigDecimal getTotalExpenses(List<UUID> propertyIds);

    Map<String, BigDecimal> getOperationalOverhead(List<UUID> propertyIds);

    // Booking Write Methods
    UnitBookingDTOs.UnitBookingResponse createPaidBooking(UnitBookingDTOs.PaidBookingRequest request);
}
