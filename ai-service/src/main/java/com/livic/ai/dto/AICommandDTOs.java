package com.livic.ai.dto;

import jakarta.validation.Valid;
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
        private String message;

        /** Optional: the app screen the user was on when asking. */
        @Valid
        private ScreenContext context;
    }

    /**
     * What the user is looking at in the app. Client-supplied, so it is only used
     * as background for the prompt and never trusted for authorization.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ScreenContext {
        @Size(max = 200)
        private String route;
        @Size(max = 100)
        private String screenName;
        @Size(max = 64)
        private String propertyId;
        @Size(max = 200)
        private String propertyName;
        @Size(max = 64)
        private String blockId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AICommandResponse {
        private String message;
        private String jobId;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AIJobCreateRequest {
        @NotBlank
        private String message;
        @NotBlank
        private String userId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AIJobCreateResponse {
        private String jobId;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AIJobStatusResponse {
        private String jobId;
        private String status;
        private String response;
        private String errorMessage;
    }
}
