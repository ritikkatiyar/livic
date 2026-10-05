package com.livic.core.community.analytics.security;

import com.livic.platform.auth.spi.PermissionCatalogContributor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/** Permissions on analytics and reports. */
@Component
@Order(70)
public class AnalyticsPermissions implements PermissionCatalogContributor {

    public static final String ANALYTICS_VIEW = "ANALYTICS_VIEW";
    public static final String REPORTS_VIEW = "REPORTS_VIEW";

    @Override
    public String module() {
        return "INSIGHTS";
    }

    @Override
    public List<Permission> permissions() {
        return List.of(
                new Permission(ANALYTICS_VIEW, "View Analytics", "View occupancy, collections and defaulters"),
                new Permission(REPORTS_VIEW, "View Reports", "View and export reports")
        );
    }
}
