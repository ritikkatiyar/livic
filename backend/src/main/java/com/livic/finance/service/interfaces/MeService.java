package com.livic.finance.service.interfaces;

import com.livic.finance.dto.MeDTOs;
import java.util.UUID;

public interface MeService {
    MeDTOs.MyContextResponse getUserContext(UUID userId);
}
