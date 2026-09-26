package com.livic.ai.persistence;

import com.livic.ai.agent.ExecutionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/** One run of an agent for one user message. */
@Entity
@Table(name = "ai_execution_tbl")
@Getter
@Setter
@NoArgsConstructor
public class AgentExecution {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "agent_id", nullable = false, length = 64)
    private String agentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private ExecutionStatus status;

    @Column(name = "steps", nullable = false)
    private int steps;

    @Column(name = "prompt", nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(name = "final_response", columnDefinition = "TEXT")
    private String finalResponse;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "model", length = 128)
    private String model;

    @Column(name = "input_tokens", nullable = false)
    private int inputTokens;

    @Column(name = "output_tokens", nullable = false)
    private int outputTokens;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static AgentExecution start(UUID userId, String agentId, String prompt) {
        AgentExecution execution = new AgentExecution();
        execution.id = UUID.randomUUID();
        execution.userId = userId;
        execution.agentId = agentId;
        execution.prompt = prompt;
        execution.status = ExecutionStatus.RUNNING;
        execution.createdAt = LocalDateTime.now();
        execution.updatedAt = execution.createdAt;
        return execution;
    }
}
