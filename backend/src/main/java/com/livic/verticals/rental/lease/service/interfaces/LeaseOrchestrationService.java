package com.livic.verticals.rental.lease.service.interfaces;

import com.livic.verticals.rental.lease.dto.LeaseDTOs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface LeaseOrchestrationService {
    Page<LeaseDTOs.LeaseResponse> getActiveLeasesByProperty(UUID propertyId, Pageable pageable);
    Page<LeaseDTOs.LeaseResponse> getActiveLeasesByProperty(UUID currentUserId, UUID propertyId, Pageable pageable);
    Page<LeaseDTOs.LeaseResponse> getActiveLeasesByProperty(UUID currentUserId, UUID propertyId, UUID blockId, Pageable pageable);
    Optional<LeaseDTOs.LeaseResponse> getActiveTenantLease(UUID userId);
    LeaseDTOs.LeaseResponse createLease(LeaseDTOs.CreateLeaseRequest request, UUID assignedByUserId);
    LeaseDTOs.LeaseResponse getLeaseById(UUID id);
    LeaseDTOs.LeaseResponse terminateLease(UUID id);
    LeaseDTOs.LeaseResponse serveNotice(UUID id, LocalDate moveOutDate);
    LeaseDTOs.LeaseResponse updateLeaseTerms(UUID id, LeaseDTOs.UpdateLeaseTermsRequest request);
}
