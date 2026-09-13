package com.livic.features.issue.service.interfaces;

import com.livic.platform.common.service.interfaces.CrudService;
import com.livic.features.issue.domain.IssueTimelineTbl;
import java.util.List;
import java.util.UUID;

public interface IssueTimelineCrudService extends CrudService<IssueTimelineTbl, UUID> {
    List<IssueTimelineTbl> findByIssueIdOrderByCreatedAtAsc(UUID issueId);
}
