package com.livic.features.issue.service.interfaces;

import com.livic.features.issue.domain.IssueTbl;

public interface EscalationStrategy {
    boolean shouldEscalate(IssueTbl issue);
}
