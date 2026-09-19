package com.livic.core.community.issue.service.interfaces;

import com.livic.core.community.issue.domain.IssueTbl;

public interface EscalationStrategy {
    boolean shouldEscalate(IssueTbl issue);
}
