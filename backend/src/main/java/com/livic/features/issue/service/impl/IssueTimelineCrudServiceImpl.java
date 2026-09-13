package com.livic.features.issue.service.impl;

import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.features.issue.domain.IssueTimelineTbl;
import com.livic.features.issue.repository.IssueTimelineRepository;
import com.livic.features.issue.service.interfaces.IssueTimelineCrudService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class IssueTimelineCrudServiceImpl extends AbstractCrudService<IssueTimelineTbl, UUID, IssueTimelineRepository> implements IssueTimelineCrudService {

    public IssueTimelineCrudServiceImpl(IssueTimelineRepository repository) {
        super(repository);
    }

    @Override
    public List<IssueTimelineTbl> findByIssueIdOrderByCreatedAtAsc(UUID issueId) {
        return repository.findByIssueIdOrderByCreatedAtAsc(issueId);
    }
}
