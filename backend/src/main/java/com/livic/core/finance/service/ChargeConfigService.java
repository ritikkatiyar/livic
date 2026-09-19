package com.livic.core.finance.service;

import com.livic.core.finance.dto.ChargeConfigRequest;
import com.livic.core.finance.dto.ChargeConfigResponse;
import java.util.UUID;

public interface ChargeConfigService {
    ChargeConfigResponse createChargeConfig(ChargeConfigRequest request);
    ChargeConfigResponse updateChargeConfig(UUID id, ChargeConfigRequest request);
    void deactivateChargeConfig(UUID id);
    void reactivateChargeConfig(UUID id);
    void deleteChargeConfigPermanently(UUID id);
}
