package com.livic.platform.common.exception;

import java.time.Instant;
import java.util.List;

public record ApiError(
        
        Instant timestamp,
        
        int status,
        
        String error,
        
        String message,
        
        String path,
        
        List<FieldErrorDetail> fieldErrors
) {

    public static ApiError of(int status, String error, String message, String path) {
        return new ApiError(Instant.now(), status, error, message, path, List.of());
    }

    public static ApiError withFieldErrors(
            int status,
            String error,
            String message,
            String path,
            List<FieldErrorDetail> fieldErrors
    ) {
        return new ApiError(Instant.now(), status, error, message, path, List.copyOf(fieldErrors));
    }
}
