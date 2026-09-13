package com.livic.features.inventory.facade;

import com.livic.features.inventory.dto.InventoryPropertyMetricsDTO;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface InventoryFacade {

    InventoryPropertyMetricsDTO getPropertyMetrics(UUID propertyId);

    BigDecimal getTotalValuationForProperty(UUID propertyId);

    long getInventoryCountForProperty(UUID propertyId);

    long getAssignedInventoryCountForLease(UUID leaseId);

    Optional<UUID> getLeaseIdForAssignment(UUID assignmentId);

    Optional<UUID> getPropertyIdForInventoryItem(UUID itemId);
}
