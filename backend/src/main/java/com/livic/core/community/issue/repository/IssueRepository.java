package com.livic.core.community.issue.repository;

import com.livic.core.community.issue.domain.IssueEscalationStatus;
import com.livic.core.community.issue.domain.IssueStatus;
import com.livic.core.community.issue.domain.IssueTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface IssueRepository extends JpaRepository<IssueTbl, UUID> {
    Page<IssueTbl> findByPropertyId(UUID propertyId, Pageable pageable);
    Page<IssueTbl> findByLeaseId(UUID leaseId, Pageable pageable);

    Page<IssueTbl> findByUnitIdIn(Collection<UUID> unitIds, Pageable pageable);
    Page<IssueTbl> findByUnitIdInOrBlockId(Collection<UUID> unitIds, UUID blockId, Pageable pageable);
    Page<IssueTbl> findByPropertyIdIn(Collection<UUID> propertyIds, Pageable pageable);
    List<IssueTbl> findByStatusInAndEscalationStatus(Collection<IssueStatus> statuses, IssueEscalationStatus escalationStatus);
}
