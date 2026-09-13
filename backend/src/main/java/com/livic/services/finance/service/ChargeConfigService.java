package com.livic.services.finance.service;

import com.livic.services.finance.dto.ChargeConfigRequest;
import com.livic.services.finance.dto.ChargeConfigResponse;
import java.util.UUID;

public interface ChargeConfigService {
    ChargeConfigResponse createChargeConfig(ChargeConfigRequest request);
    ChargeConfigResponse updateChargeConfig(UUID id, ChargeConfigRequest request);
    void deactivateChargeConfig(UUID id);
    void reactivateChargeConfig(UUID id);
    void deleteChargeConfigPermanently(UUID id);
}
