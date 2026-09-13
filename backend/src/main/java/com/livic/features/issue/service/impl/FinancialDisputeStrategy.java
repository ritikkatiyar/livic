package com.livic.features.issue.service.impl;

import com.livic.features.issue.domain.IssueCategory;
import com.livic.features.issue.domain.IssueEscalationStatus;
import com.livic.features.issue.domain.IssueStatus;
import com.livic.features.issue.domain.IssueTbl;
import com.livic.features.issue.service.interfaces.EscalationStrategy;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Component
public class FinancialDisputeStrategy implements EscalationStrategy {
    @Override
    public boolean shouldEscalate(IssueTbl issue) {
        if (issue == null) {
            return false;
        }
        
        boolean isBilling = issue.getCategory() == IssueCategory.BILLING;
        boolean isUnresolved = issue.getStatus() == IssueStatus.OPEN || issue.getStatus() == IssueStatus.IN_PROGRESS;
        boolean notEscalated = issue.getEscalationStatus() != IssueEscalationStatus.ESCALATED;
        
        if (!isBilling || !isUnresolved || !notEscalated) {
            return false;
        }
        
        long hoursElapsed = ChronoUnit.HOURS.between(issue.getCreatedAt(), LocalDateTime.now());
        return hoursElapsed >= 72;
    }
}
