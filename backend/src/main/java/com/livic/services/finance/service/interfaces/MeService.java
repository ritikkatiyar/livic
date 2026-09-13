package com.livic.services.finance.service.interfaces;

import com.livic.services.finance.dto.MeDTOs;
import java.util.UUID;

public interface MeService {
    MeDTOs.MyContextResponse getUserContext(UUID userId);
}
