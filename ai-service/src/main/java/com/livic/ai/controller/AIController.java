package com.livic.ai.controller;

import com.livic.ai.common.response.ApiResponse;
import com.livic.ai.dto.AICommandDTOs.AICommandRequest;
import com.livic.ai.dto.AICommandDTOs.AICommandResponse;
import com.livic.ai.service.AICommandService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AIController {

    private final AICommandService aiCommandService;

    /** Runs the landlord assistant on one message and returns its answer. */
    @PostMapping("/commands")
    public ResponseEntity<ApiResponse<AICommandResponse>> processCommand(
            Authentication authentication,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId,
            @Valid @RequestBody AICommandRequest request) {
        String requestId = correlationId != null ? correlationId : UUID.randomUUID().toString();
        AICommandResponse response = aiCommandService.process(
                request, authentication.getName(), (String) authentication.getCredentials(), requestId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
