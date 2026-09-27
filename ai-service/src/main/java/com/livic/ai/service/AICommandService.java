package com.livic.ai.service;

import com.livic.ai.agent.AgentContext;
import com.livic.ai.agent.AgentContext.PropertyAccess;
import com.livic.ai.agent.AgentDefinition;
import com.livic.ai.agent.AgentResult;
import com.livic.ai.client.BackendClient;
import com.livic.ai.config.AIProperties;
import com.livic.ai.dto.AICommandDTOs.AICommandRequest;
import com.livic.ai.dto.AICommandDTOs.AICommandResponse;
import com.livic.ai.orchestration.AgentRuntime;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AICommandService {

    private final AIProperties aiProperties;
    private final BackendClient backend;
    private final AgentRuntime agentRuntime;
    private final AgentDefinition landlordAssistant;

    public AICommandResponse process(AICommandRequest request, String userId, String userToken, String requestId) {
        if (!aiProperties.enabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI service is disabled");
        }
        var context = new AgentContext(UUID.fromString(userId), userToken, requestId, managedProperties(userToken));
        AgentResult result = agentRuntime.run(landlordAssistant, context, request.getMessage());
        return AICommandResponse.builder()
                .message(result.responseText())
                .executionId(result.executionId().toString())
                .status(result.status().name())
                .build();
    }

    /**
     * Properties the caller holds a membership on (owner or staff), with their effective permission codes.
     * Residents have none, so they get no tools.
     */
    private Map<UUID, PropertyAccess> managedProperties(String userToken) {
        Map<UUID, PropertyAccess> properties = new LinkedHashMap<>();
        for (JsonNode membership : backend.meContext(userToken).path("managedProperties")) {
            Set<String> codes = new HashSet<>();
            membership.path("permissionCodes").forEach(code -> codes.add(code.asString()));
            properties.put(UUID.fromString(membership.path("propertyId").asString()),
                    new PropertyAccess(membership.path("propertyName").asString(""), Set.copyOf(codes)));
        }
        return properties;
    }
}
