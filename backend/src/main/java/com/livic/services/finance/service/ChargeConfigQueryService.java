package com.livic.services.finance.service;

import com.livic.services.finance.dto.ChargeConfigResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

public interface ChargeConfigQueryService {
    Page<ChargeConfigResponse> getChargesForProperty(UUID propertyId, boolean includeInactive, UUID userId, Pageable pageable);
    ChargeConfigResponse getChargeConfigById(UUID id);
}
