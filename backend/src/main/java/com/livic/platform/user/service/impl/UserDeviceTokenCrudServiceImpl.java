package com.livic.platform.user.service.impl;

import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.platform.user.domain.UserDeviceTokenTbl;
import com.livic.platform.user.repository.UserDeviceTokenRepository;
import com.livic.platform.user.service.interfaces.UserDeviceTokenCrudService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class UserDeviceTokenCrudServiceImpl
        extends AbstractCrudService<UserDeviceTokenTbl, UUID, UserDeviceTokenRepository>
        implements UserDeviceTokenCrudService {

    public UserDeviceTokenCrudServiceImpl(UserDeviceTokenRepository repository) {
        super(repository);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserDeviceTokenTbl> findByExpoPushToken(String expoPushToken) {
        return repository.findByExpoPushToken(expoPushToken);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDeviceTokenTbl> findByUserId(UUID userId) {
        return repository.findByUserId(userId);
    }
}
