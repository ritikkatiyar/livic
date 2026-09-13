package com.livic.platform.user.service.impl;

import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.platform.user.domain.UserPreferenceTbl;
import com.livic.platform.user.repository.UserPreferenceRepository;
import com.livic.platform.user.service.interfaces.UserPreferenceCrudService;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserPreferenceCrudServiceImpl
        extends AbstractCrudService<UserPreferenceTbl, UUID, UserPreferenceRepository>
        implements UserPreferenceCrudService {

    public UserPreferenceCrudServiceImpl(UserPreferenceRepository repository) {
        super(repository);
    }

    @Override
    public Optional<UserPreferenceTbl> findByUserId(UUID userId) {
        return repository.findByUserId(userId);
    }
}
