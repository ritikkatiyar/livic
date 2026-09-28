package com.livic.ai.llm.adapter;

import com.livic.ai.tools.impl.AnalyticsSummaryTool;
import com.livic.ai.tools.impl.AnnouncementListTool;
import com.livic.ai.tools.impl.IssueGetTool;
import com.livic.ai.tools.impl.PropertyListTool;
import org.junit.jupiter.api.Test;
import org.springframework.ai.util.json.schema.JsonSchemaGenerator;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

/** The schema is all the model sees of a tool's input, so optional fields must not come out as required. */
class ToolSchemaTest {

    private final JsonMapper json = JsonMapper.builder().build();

    @Test
    void optionalFiltersAreNotRequired() {
        for (Class<?> input : new Class<?>[]{
                PropertyListTool.Input.class, AnalyticsSummaryTool.Input.class, AnnouncementListTool.Input.class}) {
            assertThat(schema(input).path("required").size()).as(input.getName()).isZero();
        }
    }

    @Test
    void requiredIdsStayRequiredAndCarryTheirDescription() {
        JsonNode schema = schema(IssueGetTool.Input.class);

        assertThat(schema.path("required").get(0).asString()).isEqualTo("issueId");
        assertThat(schema.path("properties").path("issueId").path("description").asString())
                .isEqualTo("The issueId returned by issue_list");
    }

    private JsonNode schema(Class<?> input) {
        return json.readTree(JsonSchemaGenerator.generateForType(input));
    }
}
