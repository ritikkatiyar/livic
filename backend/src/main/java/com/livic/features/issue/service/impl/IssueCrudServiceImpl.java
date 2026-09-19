package com.livic.features.issue.service.impl;

import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.features.issue.domain.IssueEscalationStatus;
import com.livic.features.issue.domain.IssueStatus;
import com.livic.features.issue.domain.IssueTbl;
import com.livic.features.issue.repository.IssueRepository;
import com.livic.features.issue.service.interfaces.IssueCrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class IssueCrudServiceImpl extends AbstractCrudService<IssueTbl, UUID, IssueRepository> implements IssueCrudService {

    public IssueCrudServiceImpl(IssueRepository repository) {
        super(repository);
    }

    @Override
    public Page<IssueTbl> findByPropertyId(UUID propertyId, Pageable pageable) {
        return repository.findByPropertyId(propertyId, pageable);
    }

    @Override
    public Page<IssueTbl> findByLeaseId(UUID leaseId, Pageable pageable) {
        return repository.findByLeaseId(leaseId, pageable);
    }

    @Override
    public Page<IssueTbl> findByUnitIdIn(Collection<UUID> unitIds, Pageable pageable) {
        return repository.findByUnitIdIn(unitIds, pageable);
    }

    @Override
    public Page<IssueTbl> findByPropertyIdIn(Collection<UUID> propertyIds, Pageable pageable) {
        return repository.findByPropertyIdIn(propertyIds, pageable);
    }

    @Override
    public List<IssueTbl> findByStatusInAndEscalationStatus(Collection<IssueStatus> statuses, IssueEscalationStatus escalationStatus) {
        return repository.findByStatusInAndEscalationStatus(statuses, escalationStatus);
    }
}
