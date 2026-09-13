package com.livic.platform.user.service.interfaces;

import com.livic.platform.user.dto.UserPreferenceResponse;
import com.livic.platform.user.dto.SaveUserPreferenceRequest;

import java.util.UUID;

public interface UserPreferenceService {
    UserPreferenceResponse savePreference(UUID userId, SaveUserPreferenceRequest request);
    UserPreferenceResponse getPreference(UUID userId);
}
