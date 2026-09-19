package com.livic.core.finance.service.interfaces;

import com.livic.core.finance.dto.MeDTOs;
import java.util.UUID;

public interface MeService {
    MeDTOs.MyContextResponse getUserContext(UUID userId);
}
