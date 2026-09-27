package com.livic.core.community.issue.repository;

import com.livic.core.community.issue.domain.IssueTimelineTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IssueTimelineRepository extends JpaRepository<IssueTimelineTbl, UUID> {
    List<IssueTimelineTbl> findByIssueIdOrderByCreatedAtAsc(UUID issueId);

    List<IssueTimelineTbl> findByIssueIdInOrderByCreatedAtAsc(Collection<UUID> issueIds);

    Optional<IssueTimelineTbl> findFirstByIssueIdOrderByCreatedAtDesc(UUID issueId);
}
