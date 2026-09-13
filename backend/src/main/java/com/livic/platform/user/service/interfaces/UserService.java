package com.livic.platform.user.service.interfaces;

import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.dto.UserDTOs;

public interface UserService {
    UserTbl createUser(UserTbl user);
    UserTbl saveUser(UserTbl user);
    UserDTOs.UserSearchResponse createTenant(UserDTOs.CreateTenantRequest request);
    UserDTOs.TenantProfileResponse updateTenantProfile(UserTbl user, UserDTOs.UpdateTenantProfileRequest request);
}
