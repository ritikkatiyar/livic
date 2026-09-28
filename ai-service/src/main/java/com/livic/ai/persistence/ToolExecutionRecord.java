package com.livic.ai.persistence;

import com.livic.ai.tools.ToolResult;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/** Immutable audit row for one tool call the model asked for, whether it ran or was refused. */
@Entity
@Table(name = "ai_tool_execution_record_tbl")
@Getter
@NoArgsConstructor
public class ToolExecutionRecord {

    @Id
    private UUID id;

    @Column(name = "execution_id", nullable = false, updatable = false)
    private UUID executionId;

    @Column(name = "step_number", nullable = false, updatable = false)
    private int stepNumber;

    @Column(name = "tool_name", nullable = false, length = 64, updatable = false)
    private String toolName;

    @Column(name = "input_payload", columnDefinition = "TEXT", updatable = false)
    private String inputPayload;

    @Column(name = "output_payload", columnDefinition = "TEXT", updatable = false)
    private String outputPayload;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32, updatable = false)
    private ToolResult.Status status;

    @Column(name = "duration_ms", nullable = false, updatable = false)
    private long durationMs;

    @Column(name = "error_message", columnDefinition = "TEXT", updatable = false)
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public ToolExecutionRecord(UUID executionId, int stepNumber, String toolName, String inputPayload,
                               String outputPayload, ToolResult.Status status, long durationMs, String errorMessage) {
        this.id = UUID.randomUUID();
        this.executionId = executionId;
        this.stepNumber = stepNumber;
        this.toolName = toolName;
        this.inputPayload = inputPayload;
        this.outputPayload = outputPayload;
        this.status = status;
        this.durationMs = durationMs;
        this.errorMessage = errorMessage;
        this.createdAt = LocalDateTime.now();
    }
}
