package com.livic.ai.tools.impl;

import tools.jackson.databind.JsonNode;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.StreamSupport;

/** Small helpers the read tools share for query building and projecting backend JSON. */
final class ToolSupport {

    /** Every list tool asks for at most this many rows (docs/AI_ARCHITECTURE_DESIGN.md §49). */
    static final int PAGE_SIZE = 20;

    private ToolSupport() {
    }

    /** Query parameters from name/value pairs; null values are kept here and skipped by the client. */
    static Map<String, Object> params(Object... namesAndValues) {
        Map<String, Object> params = new LinkedHashMap<>();
        for (int i = 0; i < namesAndValues.length; i += 2) {
            params.put((String) namesAndValues[i], namesAndValues[i + 1]);
        }
        return params;
    }

    static String text(JsonNode node, String field) {
        return node.path(field).asString(null);
    }

    /** Spring Data pages serialise either flat or with a nested "page" block. */
    static long totalCount(JsonNode page) {
        JsonNode total = page.has("totalElements") ? page.path("totalElements") : page.path("page").path("totalElements");
        return total.asLong(page.path("content").size());
    }

    static <T> List<T> content(JsonNode page, Function<JsonNode, T> projection) {
        return StreamSupport.stream(page.path("content").spliterator(), false).map(projection).toList();
    }

    /** Shape every list tool returns to the model. */
    record ListView<T>(long totalCount, int shown, List<T> items) {

        static <T> ListView<T> of(JsonNode page, Function<JsonNode, T> projection) {
            List<T> items = content(page, projection);
            return new ListView<>(ToolSupport.totalCount(page), items.size(), items);
        }
    }
}
