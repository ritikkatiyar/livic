package com.livic.verticals.rental.inventory.service.impl;

import com.livic.verticals.rental.inventory.dto.ServiceExpenseRequest;
import com.livic.verticals.rental.inventory.dto.ServiceExpenseResponse;
import com.livic.platform.common.exception.BusinessException;
import com.livic.verticals.rental.inventory.domain.InventoryItemTbl;
import com.livic.verticals.rental.inventory.domain.InventoryServiceExpenseTbl;
import com.livic.verticals.rental.inventory.domain.enums.InventoryStatus;
import com.livic.verticals.rental.inventory.mapper.InventoryMapper;
import com.livic.verticals.rental.inventory.repository.InventoryItemRepository;
import com.livic.verticals.rental.inventory.repository.InventoryServiceExpenseRepository;
import com.livic.verticals.rental.inventory.service.interfaces.InventoryServiceExpenseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryServiceExpenseServiceImpl implements InventoryServiceExpenseService {

    private final InventoryServiceExpenseRepository expenseRepository;
    private final InventoryItemRepository inventoryItemRepository;

    @Override
    @Transactional
    public ServiceExpenseResponse recordExpense(
            UUID itemId, 
            ServiceExpenseRequest request, 
            UUID userId) {
        
        InventoryItemTbl item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Inventory item not found with ID: " + itemId));

        InventoryServiceExpenseTbl expense = InventoryServiceExpenseTbl.builder()
                .id(UUID.randomUUID())
                .itemId(itemId)
                .propertyId(item.getPropertyId())
                .vendorName(request.vendorName().trim())
                .serviceDate(request.serviceDate())
                .amount(request.amount())
                .description(request.description().trim())
                .nextServiceDate(request.nextServiceDate())
                .recordedBy(userId)
                .build();

        InventoryServiceExpenseTbl saved = expenseRepository.save(expense);

        if (request.nextServiceDate() != null) {
            item.setNextServiceDate(request.nextServiceDate());
            if (item.getStatus() == InventoryStatus.SERVICE_DUE) {
                item.setStatus(InventoryStatus.AVAILABLE);
            }
            inventoryItemRepository.save(item);
        }

        log.info("[INVENTORY] Recorded service expense id={}, itemId={}, amount={}, user={}",
                saved.getId(), itemId, request.amount(), userId);

        return InventoryMapper.toServiceExpenseResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceExpenseResponse> listExpensesByItem(UUID itemId) {
        return expenseRepository.findAllByItemId(itemId).stream()
                .map(InventoryMapper::toServiceExpenseResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ServiceExpenseResponse> listExpensesByProperty(UUID propertyId, Pageable pageable) {
        return expenseRepository.findAllByPropertyId(propertyId, pageable)
                .map(InventoryMapper::toServiceExpenseResponse);
    }
}
