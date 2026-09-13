package com.livic.features.inventory.facade.impl;

import com.livic.features.inventory.domain.LeaseInventoryAssignmentTbl;
import com.livic.features.inventory.domain.enums.InventoryStatus;
import com.livic.features.inventory.dto.InventoryPropertyMetricsDTO;
import com.livic.features.inventory.facade.InventoryFacade;
import com.livic.features.inventory.mapper.InventoryMapper;
import com.livic.features.inventory.repository.InventoryItemRepository;
import com.livic.features.inventory.repository.LeaseInventoryAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryFacadeImpl implements InventoryFacade {

    private final InventoryItemRepository inventoryItemRepository;
    private final LeaseInventoryAssignmentRepository assignmentRepository;

    @Override
    public InventoryPropertyMetricsDTO getPropertyMetrics(UUID propertyId) {
        long totalAssets = inventoryItemRepository.countByPropertyId(propertyId);
        long maintenanceDue = inventoryItemRepository.countByPropertyIdAndStatus(propertyId, InventoryStatus.SERVICE_DUE);
        long unassigned = inventoryItemRepository.countByPropertyIdAndStatus(propertyId, InventoryStatus.AVAILABLE);
        BigDecimal totalValuation = inventoryItemRepository.sumReplacementValueByPropertyId(propertyId);

        return InventoryMapper.toPropertyMetricsDTO(
                totalAssets,
                maintenanceDue,
                unassigned,
                totalValuation
        );
    }

    @Override
    public BigDecimal getTotalValuationForProperty(UUID propertyId) {
        BigDecimal sum = inventoryItemRepository.sumReplacementValueByPropertyId(propertyId);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    @Override
    public long getInventoryCountForProperty(UUID propertyId) {
        return inventoryItemRepository.countByPropertyId(propertyId);
    }

    @Override
    public long getAssignedInventoryCountForLease(UUID leaseId) {
        return assignmentRepository.countByLeaseId(leaseId);
    }

    @Override
    public Optional<UUID> getLeaseIdForAssignment(UUID assignmentId) {
        if (assignmentId == null) {
            return Optional.empty();
        }
        return assignmentRepository.findById(assignmentId)
                .map(LeaseInventoryAssignmentTbl::getLeaseId);
    }

    @Override
    public Optional<UUID> getPropertyIdForInventoryItem(UUID itemId) {
        if (itemId == null) {
            return Optional.empty();
        }
        return inventoryItemRepository.findById(itemId)
                .map(com.livic.features.inventory.domain.InventoryItemTbl::getPropertyId);
    }
}
