package com.livic.services.finance.service.interfaces;

import com.livic.services.finance.dto.LedgerDTOs.LedgerEntryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.UUID;

public interface LedgerService {
    Page<LedgerEntryResponse> getLedgerForProperty(UUID propertyId, String search, LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
}
