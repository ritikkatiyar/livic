package com.livic.platform.auth.controller;

import com.livic.platform.auth.service.impl.PermissionCatalog;
import com.livic.platform.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** The permissions a staff member can be granted, grouped as the modules that own them declare. */
@RestController
@RequestMapping("/api/v1/permissions")
@RequiredArgsConstructor
public class PermissionCatalogController {

    public record FeatureEntry(String code, String label, String description) {}

    public record ModuleEntry(String module, List<FeatureEntry> features) {}

    private final PermissionCatalog permissionCatalog;

    @GetMapping("/catalog")
    public ResponseEntity<ApiResponse<List<ModuleEntry>>> getCatalog() {
        return ResponseEntity.ok(ApiResponse.success(permissionCatalog.modules().stream()
                .map(m -> new ModuleEntry(m.module(), m.permissions().stream()
                        .map(p -> new FeatureEntry(p.code(), p.label(), p.description()))
                        .toList()))
                .toList()));
    }
}
