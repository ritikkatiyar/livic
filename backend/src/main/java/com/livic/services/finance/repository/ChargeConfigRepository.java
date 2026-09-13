package com.livic.services.finance.repository;

import com.livic.services.finance.domain.ChargeConfigTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.livic.platform.common.domain.ChargeCategory;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChargeConfigRepository extends JpaRepository<ChargeConfigTbl, UUID> {
    
    List<ChargeConfigTbl> findAllByPropertyIdAndIsActiveTrue(UUID propertyId);

    List<ChargeConfigTbl> findAllByPropertyId(UUID propertyId);

    Page<ChargeConfigTbl> findAllByPropertyIdAndIsActiveTrue(UUID propertyId, Pageable pageable);

    Page<ChargeConfigTbl> findAllByPropertyId(UUID propertyId, Pageable pageable);

    boolean existsByPropertyIdAndChargeCategory(UUID propertyId, ChargeCategory chargeCategory);

    Optional<ChargeConfigTbl> findByIdAndIsActiveTrue(UUID id);
}
