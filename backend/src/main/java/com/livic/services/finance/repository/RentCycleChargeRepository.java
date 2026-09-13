package com.livic.services.finance.repository;

import com.livic.services.finance.domain.RentCycleChargeTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RentCycleChargeRepository extends JpaRepository<RentCycleChargeTbl, UUID> {
    List<RentCycleChargeTbl> findByRentCycle_Id(UUID rentCycleId);
    List<RentCycleChargeTbl> findByRentCycle_IdIn(java.util.Collection<UUID> rentCycleIds);

    boolean existsByCustomChargeConfigId(UUID customChargeConfigId);
}
