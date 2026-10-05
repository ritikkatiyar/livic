package com.livic.architecture;

import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Table;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The layering rule for the database: a table may only reference tables of its own layer or a
 * lower one (platform, then core, then verticals). ArchUnit reads bytecode and cannot see foreign
 * keys, so this checks the live schema; each table's layer is the package of its entity.
 */
@SpringBootTest
@ActiveProfiles("dev")
class SchemaLayeringTest {

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("No table holds a foreign key into a table of a higher layer")
    void foreignKeysPointDownTheLayers() {
        Map<String, Integer> layerByTable = new HashMap<>();
        entityManagerFactory.getMetamodel().getEntities().forEach(entity -> {
            Class<?> type = entity.getJavaType();
            Table table = type.getAnnotation(Table.class);
            Integer layer = layerOf(type.getPackageName());
            if (table != null && layer != null) {
                layerByTable.put(table.name().toLowerCase(), layer);
            }
        });
        assertThat(layerByTable).containsKeys("lease_tbl", "unit_member_tbl", "bill_tbl", "user_tbl");

        List<String> violations = jdbcTemplate.query("""
                        SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME
                        FROM information_schema.KEY_COLUMN_USAGE
                        WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
                        """,
                (rs, i) -> {
                    String table = rs.getString(1).toLowerCase();
                    String referenced = rs.getString(3).toLowerCase();
                    Integer from = layerByTable.get(table);
                    Integer to = layerByTable.get(referenced);
                    return from != null && to != null && to > from
                            ? table + "." + rs.getString(2).toLowerCase() + " -> " + referenced
                            : null;
                })
                .stream()
                .filter(v -> v != null)
                .toList();

        assertThat(violations)
                .as("foreign keys from a lower layer into a higher one")
                .isEmpty();
    }

    /** platform 0, core 1, verticals 2; null for anything else. */
    private static Integer layerOf(String packageName) {
        if (packageName.startsWith("com.livic.platform.")) {
            return 0;
        }
        if (packageName.startsWith("com.livic.core.")) {
            return 1;
        }
        if (packageName.startsWith("com.livic.verticals.")) {
            return 2;
        }
        return null;
    }
}
