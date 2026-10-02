package com.livic.core.property.service.interfaces;

import com.livic.core.property.dto.MeDTOs;
import java.util.UUID;

public interface MeService {
    MeDTOs.MyContextResponse getUserContext(UUID userId);
}
