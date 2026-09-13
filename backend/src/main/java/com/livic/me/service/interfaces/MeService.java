package com.livic.me.service.interfaces;

import com.livic.me.dto.MeDTOs;
import java.util.UUID;

public interface MeService {
    MeDTOs.MyContextResponse getUserContext(UUID userId);
}
