package com.livic.platform.common.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.http.MockHttpInputMessage;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/** Caller mistakes must answer 400 with a safe message, not 500. */
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    private static MockHttpServletRequest request(String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI(uri);
        return request;
    }

    @Test
    @DisplayName("Malformed JSON is a 400 and never echoes the payload")
    void malformedJson() {
        String payload = "{\"prospectPhone\": \"9876543210\", oops";
        HttpMessageNotReadableException exception = new HttpMessageNotReadableException(
                "JSON parse error: unexpected character in " + payload,
                new MockHttpInputMessage(payload.getBytes(StandardCharsets.UTF_8)));

        ResponseEntity<ApiError> response = handler.handleUnreadableBody(exception, request("/api/v1/marketplace/leads"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        ApiError body = response.getBody();
        assertNotNull(body);
        assertEquals("Request body is missing or is not valid JSON", body.message());
        assertEquals("/api/v1/marketplace/leads", body.path());
        assertFalse(body.message().contains("9876543210"));
    }

    @Test
    @DisplayName("A path variable of the wrong type is a 400 naming the parameter")
    void typeMismatch() {
        MethodArgumentTypeMismatchException exception = new MethodArgumentTypeMismatchException(
                "not-a-uuid", UUID.class, "propertyId", (MethodParameter) null, new IllegalArgumentException("bad uuid"));

        ResponseEntity<ApiError> response = handler.handleTypeMismatch(exception, request("/api/v1/properties/not-a-uuid"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        ApiError body = response.getBody();
        assertNotNull(body);
        assertEquals("Invalid request parameter", body.message());
        assertEquals("propertyId", body.fieldErrors().getFirst().field());
    }

    @Test
    @DisplayName("A missing required query parameter is a 400 naming it")
    void missingParameter() {
        MissingServletRequestParameterException exception = new MissingServletRequestParameterException("filter", "String");

        ResponseEntity<ApiError> response = handler.handleMissingParameter(exception, request("/api/v1/properties/1/tour-requests"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        ApiError body = response.getBody();
        assertNotNull(body);
        assertEquals("Missing request parameter", body.message());
        assertEquals("filter", body.fieldErrors().getFirst().field());
        assertEquals("This parameter is required", body.fieldErrors().getFirst().message());
    }
}
