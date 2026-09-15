package com.livic.platform.auth.controller;

import com.livic.platform.common.constant.StaffPermission;
import com.livic.platform.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/permissions")
public class PermissionCatalogController {

    public record FeatureEntry(String code, String label, String description) {}

    public record ModuleEntry(StaffPermission.Module module, List<FeatureEntry> features) {}

    private static final List<ModuleEntry> CATALOG = Arrays.stream(StaffPermission.values())
            .collect(Collectors.groupingBy(StaffPermission::getModule, LinkedHashMap::new,
                    Collectors.mapping(p -> new FeatureEntry(p.name(), p.getLabel(), p.getDescription()), Collectors.toList())))
            .entrySet().stream()
            .map((Map.Entry<StaffPermission.Module, List<FeatureEntry>> e) -> new ModuleEntry(e.getKey(), e.getValue()))
            .toList();

    @GetMapping("/catalog")
    public ResponseEntity<ApiResponse<List<ModuleEntry>>> getCatalog() {
        return ResponseEntity.ok(ApiResponse.success(CATALOG));
    }
}
