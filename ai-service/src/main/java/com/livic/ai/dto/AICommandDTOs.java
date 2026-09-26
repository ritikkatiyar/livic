package com.livic.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public final class AICommandDTOs {

    private AICommandDTOs() {
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AICommandRequest {
        @NotBlank
        @Size(max = 4000)
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AICommandResponse {
        private String message;
        private String executionId;
        private String status;
    }
}
