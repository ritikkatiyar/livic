package com.livic.ai.service.impl;

import com.livic.ai.config.AIProperties;
import com.livic.ai.domain.AIJobTbl;
import com.livic.ai.dto.AICommandDTOs.AICommandRequest;
import com.livic.ai.dto.AICommandDTOs.AICommandResponse;
import com.livic.ai.dto.AICommandDTOs.AIJobCreateRequest;
import com.livic.ai.dto.AICommandDTOs.AIJobCreateResponse;
import com.livic.ai.dto.AICommandDTOs.AIJobStatusResponse;
import com.livic.ai.events.AIJobCreatedEvent;
import com.livic.ai.repository.AIJobRepository;
import com.livic.ai.service.AIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.ai.chat.client.ChatClient;

import java.time.LocalDateTime;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIServiceImpl implements AIService {

    private final AIJobRepository aiJobRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final AIProperties aiProperties;

    @Autowired(required = false)
    private ChatClient chatClient;

    @Override
    public AICommandResponse processCommand(AICommandRequest request) {
        if (!aiProperties.enabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI service is disabled");
        }
        if (chatClient == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI provider is not configured");
        }

        String content = chatClient.prompt()
                .system(ScreenContextPrompt.build(request.getContext()))
                .user(request.getMessage())
                .call()
                .content();

        return AICommandResponse.builder()
                .message(content)
                .jobId(null)
                .status("COMPLETED")
                .build();
    }

    @Override
    public AIJobCreateResponse createJob(AIJobCreateRequest request) {
        if (!aiProperties.enabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI service is disabled");
        }

        String token = null;
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getCredentials() instanceof String jwt) {
            token = jwt;
        }

        UUID jobId = UUID.randomUUID();
        AIJobTbl job = AIJobTbl.builder()
                .id(jobId)
                .userId(UUID.fromString(request.getUserId()))
                .userToken(token)
                .prompt(request.getMessage())
                .status("PENDING")
                .retryCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        aiJobRepository.save(job);
        eventPublisher.publishEvent(new AIJobCreatedEvent(this, jobId));
        log.info("AI job created and event published: {}", jobId);

        return AIJobCreateResponse.builder()
                .jobId(jobId.toString())
                .status(job.getStatus())
                .build();
    }

    @Override
    public AIJobStatusResponse getJobStatus(UUID jobId) {
        AIJobTbl job = aiJobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "AI job not found"));

        return AIJobStatusResponse.builder()
                .jobId(job.getId().toString())
                .status(job.getStatus())
                .response(job.getResponse())
                .errorMessage(job.getErrorMessage())
                .build();
    }

    public String executeJob(UUID jobId) {
        AIJobTbl job = aiJobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "AI job not found"));

        if (chatClient == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI provider is not configured");
        }

        return chatClient.prompt()
                .user(job.getPrompt())
                .call()
                .content();
    }

    public void markJobProcessing(UUID jobId) {
        updateStatus(jobId, "PROCESSING", null, null, null);
    }

    public void completeJob(UUID jobId, String response) {
        updateStatus(jobId, "COMPLETED", response, null, null);
    }

    public void failJob(UUID jobId, String errorMessage) {
        updateStatus(jobId, "FAILED", null, errorMessage, null);
    }

    private void updateStatus(UUID jobId, String status, String response, String errorMessage, Integer retryCount) {
        AIJobTbl job = aiJobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "AI job not found"));
        job.setStatus(status);
        job.setResponse(response);
        job.setErrorMessage(errorMessage);
        if (retryCount != null) {
            job.setRetryCount(retryCount);
        }
        job.setUpdatedAt(LocalDateTime.now());
        aiJobRepository.save(job);
    }
}
