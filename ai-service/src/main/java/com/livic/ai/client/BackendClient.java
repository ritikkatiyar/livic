package com.livic.ai.client;

import com.livic.ai.config.BackendClientProperties;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.Map;

/**
 * Calls the Livic backend as the requesting user by relaying their JWT, so the backend's own
 * permission checks decide what they can see. ai-service never touches business tables.
 */
@Component
public class BackendClient {

    private static final Duration TIMEOUT = Duration.ofSeconds(10);

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public BackendClient(WebClient.Builder webClientBuilder, BackendClientProperties properties, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.baseUrl(properties.baseUrl()).build();
        this.objectMapper = objectMapper;
    }

    /** GETs {@code path} and returns the {@code data} of the backend's ApiResponse envelope. Null query values are skipped. */
    public JsonNode get(String path, Map<String, ?> query, String userToken) {
        String body;
        try {
            body = webClient.get()
                    .uri(uri -> {
                        uri.path(path);
                        query.forEach((name, value) -> {
                            if (value != null) {
                                uri.queryParam(name, value);
                            }
                        });
                        return uri.build();
                    })
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(TIMEOUT);
        } catch (WebClientResponseException e) {
            throw new BackendException(e.getStatusCode().value(), describe(e));
        } catch (RuntimeException e) {
            throw new BackendException("The Livic backend did not respond. Try again shortly.", e);
        }
        try {
            return objectMapper.readTree(body == null ? "{}" : body).path("data");
        } catch (JacksonException e) {
            throw new BackendException("The Livic backend returned an unreadable response.", e);
        }
    }

    /** The caller's property memberships and permission codes. */
    public JsonNode meContext(String userToken) {
        return get("/api/v1/me/context", Map.of(), userToken);
    }

    private String describe(WebClientResponseException e) {
        String backendMessage = null;
        try {
            backendMessage = objectMapper.readTree(e.getResponseBodyAsString()).path("error").asString(null);
        } catch (JacksonException ignored) {
            // fall back to the status text below
        }
        if (backendMessage != null && !backendMessage.isBlank()) {
            return backendMessage;
        }
        return switch (e.getStatusCode().value()) {
            case 401 -> "Your session has expired. Sign in again.";
            case 403 -> "You don't have access to that.";
            case 404 -> "That record was not found.";
            default -> "The Livic backend could not complete the request.";
        };
    }
}
