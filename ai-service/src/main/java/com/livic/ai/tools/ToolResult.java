package com.livic.ai.tools;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Outcome of one tool call.
 *
 * @param summary one-line natural-language framing for the model
 * @param data    lean projection of the backend response; never a raw backend DTO
 */
public record ToolResult(Status status, String summary, Object data, String errorMessage) {

    public enum Status {
        SUCCESS,
        ERROR,
        DENIED
    }

    public static ToolResult success(String summary, Object data) {
        return new ToolResult(Status.SUCCESS, summary, data, null);
    }

    public static ToolResult error(String message) {
        return new ToolResult(Status.ERROR, null, null, message);
    }

    public static ToolResult denied(String message) {
        return new ToolResult(Status.DENIED, null, null, message);
    }

    /** What the model sees for this call, with empty fields left out. */
    public Map<String, Object> toModelView() {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("status", status.name());
        if (summary != null) {
            view.put("summary", summary);
        }
        if (data != null) {
            view.put("data", data);
        }
        if (errorMessage != null) {
            view.put("error", errorMessage);
        }
        return view;
    }
}
