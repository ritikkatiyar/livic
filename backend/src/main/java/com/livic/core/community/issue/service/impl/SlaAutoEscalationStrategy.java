package com.livic.core.community.issue.service.impl;

import com.livic.core.community.issue.domain.IssueEscalationStatus;
import com.livic.core.community.issue.domain.IssuePriority;
import com.livic.core.community.issue.domain.IssueStatus;
import com.livic.core.community.issue.domain.IssueTbl;
import com.livic.core.community.issue.domain.IssueTimelineTbl;
import com.livic.core.community.issue.service.interfaces.EscalationStrategy;
import com.livic.core.community.issue.service.interfaces.IssueTimelineCrudService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
public class SlaAutoEscalationStrategy implements EscalationStrategy {

    private final IssueTimelineCrudService issueTimelineCrudService;

    @Override
    public boolean shouldEscalate(IssueTbl issue) {
        if (issue == null) {
            return false;
        }
        
        boolean hasPriority = issue.getPriority() == IssuePriority.HIGH || issue.getPriority() == IssuePriority.URGENT;
        boolean isOpen = issue.getStatus() == IssueStatus.OPEN;
        boolean notEscalated = issue.getEscalationStatus() != IssueEscalationStatus.ESCALATED;
        
        if (!hasPriority || !isOpen || !notEscalated) {
            return false;
        }

        List<IssueTimelineTbl> timeline = issueTimelineCrudService.findByIssueIdOrderByCreatedAtAsc(issue.getId());
        LocalDateTime latestActivity = issue.getCreatedAt();
        if (timeline != null && !timeline.isEmpty()) {
            latestActivity = timeline.get(timeline.size() - 1).getCreatedAt();
        }

        long hoursElapsed = ChronoUnit.HOURS.between(latestActivity, LocalDateTime.now());
        return hoursElapsed >= 48;
    }
}
