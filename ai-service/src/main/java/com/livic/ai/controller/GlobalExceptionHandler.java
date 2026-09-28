package com.livic.ai.controller;

import com.livic.ai.client.BackendException;
import com.livic.ai.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatus(ResponseStatusException ex, HttpServletRequest request) {
        return ResponseEntity.status(ex.getStatusCode()).body(ApiResponse.error(ex.getReason()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        var fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> String.format("%s: %s", e.getField(), e.getDefaultMessage()))
                .toList();
        
        String errorMessage = "Validation failed: " + String.join(", ", fieldErrors);
        return ResponseEntity.badRequest().body(ApiResponse.error(errorMessage));
    }

    /** The caller's session or access as the backend sees it; anything else means the backend is unavailable. */
    @ExceptionHandler(BackendException.class)
    public ResponseEntity<ApiResponse<Void>> handleBackend(BackendException ex, HttpServletRequest request) {
        HttpStatus status = ex.getStatus() == 401 || ex.getStatus() == 403
                ? HttpStatus.valueOf(ex.getStatus())
                : HttpStatus.BAD_GATEWAY;
        log.warn("Backend call failed on {}: {} {}", request.getRequestURI(), ex.getStatus(), ex.getMessage());
        return ResponseEntity.status(status).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error on {}", request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Internal server error"));
    }
}
