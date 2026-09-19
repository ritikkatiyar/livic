package com.livic.core.community.issue.service.impl;

import com.livic.core.community.issue.domain.IssueCategory;
import com.livic.core.community.issue.domain.IssueEscalationStatus;
import com.livic.core.community.issue.domain.IssueTbl;
import com.livic.core.community.issue.service.interfaces.EscalationStrategy;
import org.springframework.stereotype.Component;

@Component
public class SafetyEmergencyStrategy implements EscalationStrategy {
    @Override
    public boolean shouldEscalate(IssueTbl issue) {
        return issue != null 
                && issue.getCategory() == IssueCategory.SAFETY 
                && issue.getEscalationStatus() != IssueEscalationStatus.ESCALATED;
    }
}
