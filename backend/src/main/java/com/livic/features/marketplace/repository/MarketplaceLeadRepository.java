package com.livic.features.marketplace.repository;

import com.livic.platform.common.domain.LeadStatus;
import com.livic.features.marketplace.domain.MarketplaceLeadTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface MarketplaceLeadRepository extends JpaRepository<MarketplaceLeadTbl, UUID> {

    Page<MarketplaceLeadTbl> findByPropertyId(UUID propertyId, Pageable pageable);

    List<MarketplaceLeadTbl> findByProspectPhoneAndCreatedAtAfter(String prospectPhone, Instant since);

    long countByProspectPhoneAndCreatedAtAfter(String prospectPhone, Instant since);

    Page<MarketplaceLeadTbl> findByStatus(LeadStatus status, Pageable pageable);
}
