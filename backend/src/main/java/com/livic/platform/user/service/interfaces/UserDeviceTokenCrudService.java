package com.livic.platform.user.service.interfaces;

import com.livic.platform.common.service.interfaces.CrudService;
import com.livic.platform.user.domain.UserDeviceTokenTbl;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserDeviceTokenCrudService extends CrudService<UserDeviceTokenTbl, UUID> {
    Optional<UserDeviceTokenTbl> findByExpoPushToken(String expoPushToken);
    List<UserDeviceTokenTbl> findByUserId(UUID userId);
}
