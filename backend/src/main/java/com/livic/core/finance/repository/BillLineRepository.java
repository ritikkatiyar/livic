package com.livic.core.finance.repository;

import com.livic.core.finance.domain.BillLineTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BillLineRepository extends JpaRepository<BillLineTbl, UUID> {
    List<BillLineTbl> findByBill_Id(UUID billId);
    List<BillLineTbl> findByBill_IdIn(java.util.Collection<UUID> billIds);

    boolean existsByCustomChargeConfigId(UUID customChargeConfigId);
}
