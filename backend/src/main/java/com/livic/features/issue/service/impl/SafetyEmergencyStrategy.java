package com.livic.features.issue.service.impl;

import com.livic.features.issue.domain.IssueCategory;
import com.livic.features.issue.domain.IssueEscalationStatus;
import com.livic.features.issue.domain.IssueTbl;
import com.livic.features.issue.service.interfaces.EscalationStrategy;
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
