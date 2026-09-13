package com.livic.platform.auth.service.impl;

import com.livic.platform.auth.domain.PermissionTbl;
import com.livic.platform.auth.repository.PermissionRepository;
import com.livic.platform.auth.service.interfaces.PermissionCrudService;
import com.livic.platform.common.service.impl.AbstractCrudService;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PermissionCrudServiceImpl extends AbstractCrudService<PermissionTbl, UUID, PermissionRepository> implements PermissionCrudService {

    public PermissionCrudServiceImpl(PermissionRepository repository) {
        super(repository);
    }

    @Override
    public Optional<PermissionTbl> findByCode(String code) {
        return repository.findByCode(code);
    }

    @Override
    public List<PermissionTbl> findByCodeIn(Collection<String> codes) {
        return repository.findByCodeIn(codes);
    }
}
