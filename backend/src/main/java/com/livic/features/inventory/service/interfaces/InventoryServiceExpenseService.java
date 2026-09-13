package com.livic.features.inventory.service.interfaces;

import com.livic.features.inventory.dto.ServiceExpenseRequest;
import com.livic.features.inventory.dto.ServiceExpenseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface InventoryServiceExpenseService {

    ServiceExpenseResponse recordExpense(UUID itemId, ServiceExpenseRequest request, UUID userId);

    List<ServiceExpenseResponse> listExpensesByItem(UUID itemId);

    Page<ServiceExpenseResponse> listExpensesByProperty(UUID propertyId, Pageable pageable);
}
