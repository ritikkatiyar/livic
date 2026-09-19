package com.livic.verticals.rental.inventory.repository;

import com.livic.verticals.rental.inventory.domain.InventoryServiceExpenseTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryServiceExpenseRepository extends JpaRepository<InventoryServiceExpenseTbl, UUID> {

    List<InventoryServiceExpenseTbl> findAllByItemId(UUID itemId);

    List<InventoryServiceExpenseTbl> findAllByPropertyId(UUID propertyId);

    Page<InventoryServiceExpenseTbl> findAllByPropertyId(UUID propertyId, Pageable pageable);
}
