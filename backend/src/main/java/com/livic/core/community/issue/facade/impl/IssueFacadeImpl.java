package com.livic.core.community.issue.facade.impl;

import com.livic.core.community.issue.facade.IssueFacade;
import com.livic.core.community.issue.service.interfaces.IssueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class IssueFacadeImpl implements IssueFacade {

    private final IssueService issueService;
}
