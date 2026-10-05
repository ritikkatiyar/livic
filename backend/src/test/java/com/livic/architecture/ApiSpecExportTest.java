package com.livic.architecture;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Writes the OpenAPI spec to {@code api/openapi.json}, which the apps generate their API types
 * from. CI fails when the committed file differs from what this writes, so an API change and
 * the apps' types travel in the same commit.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("dev")
class ApiSpecExportTest {

    private static final Path SPEC = Path.of("..", "api", "openapi.json");

    @Autowired
    private Environment environment;

    @Test
    @DisplayName("Writes the OpenAPI spec the apps generate their types from")
    void exportsSpec() throws Exception {
        String port = environment.getProperty("local.server.port");
        HttpResponse<String> response = HttpClient.newHttpClient().send(
                HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/v3/api-docs")).GET().build(),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        assertThat(response.statusCode()).isEqualTo(200);

        // Sorted keys, so the file only changes when the API does.
        ObjectMapper mapper = new ObjectMapper()
                .enable(SerializationFeature.INDENT_OUTPUT)
                .enable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS);
        Object spec = mapper.readValue(response.body(), Object.class);

        Files.createDirectories(SPEC.getParent());
        Files.writeString(SPEC, mapper.writeValueAsString(spec) + "\n", StandardCharsets.UTF_8);
    }
}
