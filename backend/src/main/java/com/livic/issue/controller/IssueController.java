package com.livic.issue.controller;

import com.livic.security.UserDetailsImpl;
import com.livic.common.response.ApiResponse;
import com.livic.issue.dto.IssueDTOs.CreateCommentRequest;
import com.livic.issue.dto.IssueDTOs.CreateIssueRequest;
import com.livic.issue.dto.IssueDTOs.EscalateRequest;
import com.livic.issue.dto.IssueDTOs.IssueResponse;
import com.livic.issue.dto.IssueDTOs.UpdateStatusRequest;
import com.livic.issue.service.interfaces.IssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;

    @PostMapping
    public ResponseEntity<ApiResponse<IssueResponse>> createIssue(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody CreateIssueRequest request
    ) {
        UUID callerUserId = UUID.fromString(currentUser.getId());
        IssueResponse response = issueService.createIssue(request, callerUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<IssueResponse>>> listIssues(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC, size = 20) Pageable pageable
    ) {
        UUID callerUserId = UUID.fromString(currentUser.getId());
        Page<IssueResponse> response = issueService.listIssues(callerUserId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IssueResponse>> getIssue(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PathVariable UUID id
    ) {
        UUID callerUserId = UUID.fromString(currentUser.getId());
        IssueResponse response = issueService.getIssue(id, callerUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<IssueResponse>> addComment(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PathVariable UUID id,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        UUID callerUserId = UUID.fromString(currentUser.getId());
        IssueResponse response = issueService.addComment(id, request.content(), callerUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<IssueResponse>> updateStatus(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStatusRequest request
    ) {
        UUID callerUserId = UUID.fromString(currentUser.getId());
        IssueResponse response = issueService.updateStatus(id, request, callerUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/escalate")
    public ResponseEntity<ApiResponse<IssueResponse>> escalateIssue(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PathVariable UUID id,
            @Valid @RequestBody EscalateRequest request
    ) {
        UUID callerUserId = UUID.fromString(currentUser.getId());
        IssueResponse response = issueService.escalateIssue(id, request.reason(), callerUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
