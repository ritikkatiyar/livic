package com.livic.core.community.issue.repository;

import com.livic.core.community.issue.domain.IssueTimelineTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface IssueTimelineRepository extends JpaRepository<IssueTimelineTbl, UUID> {
    List<IssueTimelineTbl> findByIssueIdOrderByCreatedAtAsc(UUID issueId);
}
