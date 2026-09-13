package com.livic.services.property.repository;

import com.livic.services.property.domain.PropertyJoinCodeTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PropertyJoinCodeRepository extends JpaRepository<PropertyJoinCodeTbl, UUID> {
    Optional<PropertyJoinCodeTbl> findByCode(String code);
    List<PropertyJoinCodeTbl> findByPropertyId(UUID propertyId);
    Page<PropertyJoinCodeTbl> findByPropertyId(UUID propertyId, Pageable pageable);
}
