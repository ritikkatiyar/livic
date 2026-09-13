package com.livic.features.inventory.service.impl;

import com.livic.features.inventory.dto.CreateInventoryItemRequest;
import com.livic.features.inventory.dto.InventoryItemResponse;
import com.livic.features.inventory.dto.InventoryStatsResponse;
import com.livic.features.inventory.dto.TenantVisibleInventoryResponse;
import com.livic.features.inventory.dto.UpdateInventoryItemRequest;
import com.livic.platform.common.exception.BusinessException;
import com.livic.services.finance.dto.LeaseSummaryDTO;
import com.livic.services.finance.facade.FinanceFacade;
import com.livic.features.inventory.domain.InventoryItemTbl;
import com.livic.features.inventory.domain.enums.InventoryScope;
import com.livic.features.inventory.domain.enums.InventoryStatus;
import com.livic.features.inventory.mapper.InventoryMapper;
import com.livic.features.inventory.repository.InventoryItemRepository;
import com.livic.features.inventory.service.interfaces.InventoryItemService;
import com.livic.services.property.facade.PropertyFacade;
import com.livic.platform.common.enums.OwnerModule;
import com.livic.platform.storage.dto.MediaDTOs;
import com.livic.platform.storage.facade.StorageFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryItemServiceImpl implements InventoryItemService {

    private final InventoryItemRepository inventoryItemRepository;
    private final StorageFacade storageFacade;
    private final PropertyFacade propertyFacade;
    private final FinanceFacade financeFacade;

    @Override
    @Transactional
    public InventoryItemResponse createItem(CreateInventoryItemRequest request, UUID userId) {
        if (!propertyFacade.existsPropertyById(request.propertyId())) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Property not found with ID: " + request.propertyId());
        }

        InventoryItemTbl item = InventoryItemTbl.builder()
                .id(UUID.randomUUID())
                .propertyId(request.propertyId())
                .unitId(request.unitId())
                .name(request.name().trim())
                .category(request.category())
                .serialNumber(request.serialNumber() != null ? request.serialNumber().trim() : null)
                .modelNumber(request.modelNumber() != null ? request.modelNumber().trim() : null)
                .scope(request.scope())
                .currentCondition(request.currentCondition())
                .status(request.status())
                .purchaseDate(request.purchaseDate())
                .warrantyExpiresAt(request.warrantyExpiresAt())
                .nextServiceDate(request.nextServiceDate())
                .replacementValue(request.replacementValue())
                .notes(request.notes())
                .build();

        InventoryItemTbl saved = inventoryItemRepository.save(item);
        log.info("[INVENTORY] Created inventory item id={}, propertyId={}, name='{}', user={}",
                saved.getId(), saved.getPropertyId(), saved.getName(), userId);

        return InventoryMapper.toResponse(saved, null, null);
    }

    @Override
    @Transactional
    public InventoryItemResponse updateItem(UUID itemId, UpdateInventoryItemRequest request, UUID userId) {
        InventoryItemTbl item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Inventory item not found with ID: " + itemId));

        item.setUnitId(request.unitId());
        item.setName(request.name().trim());
        item.setCategory(request.category());
        item.setSerialNumber(request.serialNumber() != null ? request.serialNumber().trim() : null);
        item.setModelNumber(request.modelNumber() != null ? request.modelNumber().trim() : null);
        item.setScope(request.scope());
        item.setCurrentCondition(request.currentCondition());
        item.setStatus(request.status());
        item.setPurchaseDate(request.purchaseDate());
        item.setWarrantyExpiresAt(request.warrantyExpiresAt());
        item.setNextServiceDate(request.nextServiceDate());
        item.setReplacementValue(request.replacementValue());
        item.setNotes(request.notes());

        InventoryItemTbl updated = inventoryItemRepository.save(item);
        log.info("[INVENTORY] Updated inventory item id={}, name='{}', user={}", updated.getId(), updated.getName(), userId);

        String image = resolvePrimaryImage(updated.getId());
        return InventoryMapper.toResponse(updated, null, image);
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryItemResponse getItem(UUID itemId) {
        InventoryItemTbl item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Inventory item not found with ID: " + itemId));
        String image = resolvePrimaryImage(item.getId());
        return InventoryMapper.toResponse(item, null, image);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryItemResponse> listItemsByProperty(
            UUID propertyId, 
            String query, 
            InventoryStatus status, 
            InventoryScope scope, 
            Boolean serviceDueOnly) {
        
        List<InventoryItemTbl> items = inventoryItemRepository.findAllByPropertyId(propertyId);
        
        LocalDate today = LocalDate.now();
        List<InventoryItemTbl> filtered = items.stream()
                .filter(item -> {
                    if (query != null && !query.isBlank()) {
                        String q = query.trim().toLowerCase();
                        boolean matchName = item.getName() != null && item.getName().toLowerCase().contains(q);
                        boolean matchSerial = item.getSerialNumber() != null && item.getSerialNumber().toLowerCase().contains(q);
                        boolean matchCategory = item.getCategory() != null && item.getCategory().name().toLowerCase().contains(q);
                        if (!matchName && !matchSerial && !matchCategory) return false;
                    }
                    if (status != null && item.getStatus() != status) return false;
                    if (scope != null && item.getScope() != scope) return false;
                    if (Boolean.TRUE.equals(serviceDueOnly)) {
                        boolean statusDue = item.getStatus() == InventoryStatus.SERVICE_DUE;
                        boolean dateDue = item.getNextServiceDate() != null && !item.getNextServiceDate().isAfter(today);
                        if (!statusDue && !dateDue) return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());

        Set<UUID> itemIds = filtered.stream().map(InventoryItemTbl::getId).collect(Collectors.toSet());
        Map<UUID, List<MediaDTOs.MediaAssetDTO>> mediaMap = storageFacade.getAssetsForReferences(OwnerModule.INVENTORY, itemIds);

        return filtered.stream()
                .map(item -> {
                    List<MediaDTOs.MediaAssetDTO> assets = mediaMap.get(item.getId());
                    String primaryImage = (assets != null && !assets.isEmpty()) ? assets.get(0).url() : null;
                    return InventoryMapper.toResponse(item, null, primaryImage);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryItemResponse> listItemsByPropertyPaginated(UUID propertyId, Pageable pageable) {
        Page<InventoryItemTbl> page = inventoryItemRepository.findAllByPropertyId(propertyId, pageable);
        Set<UUID> itemIds = page.getContent().stream().map(InventoryItemTbl::getId).collect(Collectors.toSet());
        Map<UUID, List<MediaDTOs.MediaAssetDTO>> mediaMap = storageFacade.getAssetsForReferences(OwnerModule.INVENTORY, itemIds);

        List<InventoryItemResponse> dtoList = page.getContent().stream()
                .map(item -> {
                    List<MediaDTOs.MediaAssetDTO> assets = mediaMap.get(item.getId());
                    String primaryImage = (assets != null && !assets.isEmpty()) ? assets.get(0).url() : null;
                    return InventoryMapper.toResponse(item, null, primaryImage);
                })
                .collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, page.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public TenantVisibleInventoryResponse getTenantVisibleItems(UUID userId, UUID propertyId) {
        Optional<LeaseSummaryDTO> activeLeaseOpt = financeFacade.getActiveLeaseForUser(userId);
        if (activeLeaseOpt.isEmpty()) {
            return new TenantVisibleInventoryResponse(List.of(), List.of());
        }

        LeaseSummaryDTO lease = activeLeaseOpt.get();
        UUID targetPropertyId = propertyId != null ? propertyId : lease.propertyId();
        if (targetPropertyId == null || !targetPropertyId.equals(lease.propertyId())) {
            return new TenantVisibleInventoryResponse(List.of(), List.of());
        }

        List<InventoryItemTbl> sharedItems = inventoryItemRepository.findAllByPropertyIdAndScope(targetPropertyId, InventoryScope.PROPERTY_SHARED);
        List<InventoryItemTbl> unitItems = lease.unitId() != null
                ? inventoryItemRepository.findAllByPropertyIdAndUnitId(targetPropertyId, lease.unitId())
                : List.of();

        Set<UUID> allIds = sharedItems.stream().map(InventoryItemTbl::getId).collect(Collectors.toSet());
        allIds.addAll(unitItems.stream().map(InventoryItemTbl::getId).collect(Collectors.toSet()));
        Map<UUID, List<MediaDTOs.MediaAssetDTO>> mediaMap = storageFacade.getAssetsForReferences(OwnerModule.INVENTORY, allIds);

        List<InventoryItemResponse> sharedDTOs = sharedItems.stream()
                .map(item -> {
                    List<MediaDTOs.MediaAssetDTO> assets = mediaMap.get(item.getId());
                    String img = (assets != null && !assets.isEmpty()) ? assets.get(0).url() : null;
                    return InventoryMapper.toResponse(item, null, img);
                })
                .collect(Collectors.toList());

        List<InventoryItemResponse> unitDTOs = unitItems.stream()
                .map(item -> {
                    List<MediaDTOs.MediaAssetDTO> assets = mediaMap.get(item.getId());
                    String img = (assets != null && !assets.isEmpty()) ? assets.get(0).url() : null;
                    return InventoryMapper.toResponse(item, null, img);
                })
                .collect(Collectors.toList());

        return new TenantVisibleInventoryResponse(unitDTOs, sharedDTOs);
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryStatsResponse getInventoryStats(UUID propertyId) {
        long totalAssets = inventoryItemRepository.countByPropertyId(propertyId);
        long maintenanceDue = inventoryItemRepository.countByPropertyIdAndStatus(propertyId, InventoryStatus.SERVICE_DUE);
        long unassigned = inventoryItemRepository.countByPropertyIdAndStatus(propertyId, InventoryStatus.AVAILABLE);
        BigDecimal totalValuation = inventoryItemRepository.sumReplacementValueByPropertyId(propertyId);

        return new InventoryStatsResponse(
                totalAssets,
                maintenanceDue,
                unassigned,
                totalValuation != null ? totalValuation : BigDecimal.ZERO
        );
    }

    private String resolvePrimaryImage(UUID itemId) {
        List<MediaDTOs.MediaAssetDTO> assets = storageFacade.getAssets(OwnerModule.INVENTORY, itemId);
        return (assets != null && !assets.isEmpty()) ? assets.get(0).url() : null;
    }
}
