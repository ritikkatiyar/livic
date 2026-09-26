package com.livic.verticals.rental.inventory.facade;

import com.livic.verticals.rental.inventory.dto.InventoryPropertyMetricsDTO;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface InventoryFacade {

    InventoryPropertyMetricsDTO getPropertyMetrics(UUID propertyId);

    Optional<UUID> getLeaseIdForAssignment(UUID assignmentId);

    Optional<UUID> getPropertyIdForInventoryItem(UUID itemId);
}
