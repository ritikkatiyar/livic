package com.livic.features.issue.facade.impl;

import com.livic.features.issue.facade.IssueFacade;
import com.livic.features.issue.service.interfaces.IssueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class IssueFacadeImpl implements IssueFacade {

    private final IssueService issueService;
}
