package com.livic.ai.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

class ArchitectureTest {

    private static JavaClasses classes;

    @BeforeAll
    static void setUp() {
        classes = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages("com.livic.ai");
    }

    @Test
    @DisplayName("Only the LLM adapter may use Spring AI")
    void springAiStaysInTheAdapter() {
        ArchRule rule = noClasses().that().resideOutsideOfPackage("com.livic.ai.llm.adapter..")
                .should().dependOnClassesThat().resideInAPackage("org.springframework.ai..")
                .because("agents, tools and the runtime must survive a change of model provider "
                        + "(docs/AI_ARCHITECTURE_DESIGN.md, locked decision 1)");
        rule.check(classes);
    }

    @Test
    @DisplayName("Tools never call other tools or drive the loop")
    void toolsDoNotOrchestrate() {
        ArchRule rule = noClasses().that().resideInAPackage("com.livic.ai.tools.impl..")
                .should().dependOnClassesThat().resideInAnyPackage(
                        "com.livic.ai.orchestration..", "com.livic.ai.persistence..", "com.livic.ai.llm..")
                .because("composition belongs to AgentRuntime (docs/AI_ARCHITECTURE_DESIGN.md §50)");
        rule.check(classes);
    }
}
