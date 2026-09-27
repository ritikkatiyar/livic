package com.livic.platform.user.service.interfaces;

import com.livic.platform.user.domain.DevicePlatform;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.dto.UserDTOs;

import java.util.UUID;

public interface UserService {
    UserTbl createUser(UserTbl user);
    UserDTOs.UserSearchResponse createTenant(UserDTOs.CreateTenantRequest request);
    UserDTOs.TenantProfileResponse updateTenantProfile(UUID userId, UserDTOs.UpdateTenantProfileRequest request);
    void registerDeviceToken(UUID userId, String expoPushToken, DevicePlatform platform);
}
