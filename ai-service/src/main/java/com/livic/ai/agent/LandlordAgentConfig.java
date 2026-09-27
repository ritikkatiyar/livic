package com.livic.ai.agent;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

/** The one agent in slice 1; a router and registry come when there is a second. */
@Configuration
public class LandlordAgentConfig {

    @Bean
    public AgentDefinition landlordAssistant(
            @Value("classpath:prompts/landlord-assistant.md") Resource systemPrompt) throws IOException {
        return new AgentDefinition(
                "landlord-assistant",
                systemPrompt.getContentAsString(StandardCharsets.UTF_8),
                List.of("property_list", "issue_list", "issue_get",
                        "analytics_summary", "analytics_defaulters", "announcement_list"),
                8,
                0.2);
    }
}
