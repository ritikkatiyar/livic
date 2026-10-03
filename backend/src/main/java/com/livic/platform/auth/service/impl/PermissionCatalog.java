package com.livic.platform.auth.service.impl;

import com.livic.platform.auth.domain.PermissionTbl;
import com.livic.platform.auth.repository.PermissionRepository;
import com.livic.platform.auth.spi.PermissionCatalogContributor;
import com.livic.platform.auth.spi.PermissionCatalogContributor.Permission;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Every permission a staff member can be granted, as the modules declare them through
 * {@link PermissionCatalogContributor}. FULL_ACCESS members hold all of them.
 */
@Slf4j
@Component
public class PermissionCatalog {

    public record Module(String module, List<Permission> permissions) {
    }

    private final List<Module> modules;
    private final Set<String> codes;
    private final PermissionRepository permissionRepository;

    public PermissionCatalog(List<PermissionCatalogContributor> contributors, PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
        Map<String, List<Permission>> byModule = new LinkedHashMap<>();
        Set<String> seen = new HashSet<>();
        for (PermissionCatalogContributor contributor : contributors) {
            for (Permission permission : contributor.permissions()) {
                if (permission.code().endsWith("_OWN")) {
                    throw new IllegalStateException(permission.code() + " is self-service and cannot be granted; "
                            + contributor.getClass().getName() + " must not declare it");
                }
                if (!seen.add(permission.code())) {
                    throw new IllegalStateException("Permission " + permission.code() + " is declared twice");
                }
                byModule.computeIfAbsent(contributor.module(), m -> new java.util.ArrayList<>()).add(permission);
            }
        }
        this.modules = byModule.entrySet().stream()
                .map(e -> new Module(e.getKey(), List.copyOf(e.getValue())))
                .toList();
        this.codes = Set.copyOf(seen);
    }

    public List<Module> modules() {
        return modules;
    }

    public Set<String> codes() {
        return codes;
    }

    public boolean isGrantable(String code) {
        return codes.contains(code);
    }

    /**
     * Grants are stored against {@code permission_tbl} rows, so a code a module has just declared
     * needs its row before anyone can be given it.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void registerMissingPermissions() {
        Set<String> existing = permissionRepository.findByCodeIn(codes).stream()
                .map(PermissionTbl::getCode)
                .collect(Collectors.toSet());
        List<PermissionTbl> missing = modules.stream()
                .flatMap(m -> m.permissions().stream())
                .filter(p -> !existing.contains(p.code()))
                .map(p -> PermissionTbl.builder().code(p.code()).description(p.description()).build())
                .toList();
        if (missing.isEmpty()) {
            return;
        }
        try {
            permissionRepository.saveAll(missing);
            log.info("Registered {} new permission codes", missing.size());
        } catch (DataIntegrityViolationException e) {
            // Another instance registered them at the same moment.
            log.info("Permission codes were registered concurrently: {}", e.getMostSpecificCause().getMessage());
        }
    }
}
