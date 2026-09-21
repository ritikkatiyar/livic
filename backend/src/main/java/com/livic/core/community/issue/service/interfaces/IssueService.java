package com.livic.core.community.issue.service.interfaces;

import com.livic.core.community.issue.dto.IssueDTOs.CreateIssueRequest;
import com.livic.core.community.issue.dto.IssueDTOs.IssueResponse;
import com.livic.core.community.issue.dto.IssueDTOs.UpdateStatusRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

public interface IssueService {
    IssueResponse createIssue(CreateIssueRequest request, UUID callerUserId);
    Page<IssueResponse> listIssues(UUID callerUserId, UUID blockId, Pageable pageable);
    default Page<IssueResponse> listIssues(UUID callerUserId, Pageable pageable) {
        return listIssues(callerUserId, null, pageable);
    }
    IssueResponse getIssue(UUID issueId, UUID callerUserId);
    IssueResponse addComment(UUID issueId, String content, UUID callerUserId);
    IssueResponse updateStatus(UUID issueId, UpdateStatusRequest request, UUID callerUserId);
    IssueResponse escalateIssue(UUID issueId, String reason, UUID callerUserId);
    void runDailyEscalationJob();
}
