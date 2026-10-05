package com.livic.core.community.issue.security;

import com.livic.platform.auth.spi.PermissionCatalogContributor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/** Permissions on residents' issues. */
@Component
@Order(50)
public class IssuePermissions implements PermissionCatalogContributor {

    public static final String ISSUE_VIEW = "ISSUE_VIEW";
    public static final String ISSUE_MANAGE = "ISSUE_MANAGE";

    @Override
    public String module() {
        return "ISSUES";
    }

    @Override
    public List<Permission> permissions() {
        return List.of(
                new Permission(ISSUE_VIEW, "View Issues", "View residents' issues and escalations"),
                new Permission(ISSUE_MANAGE, "Manage Issues", "Update, assign and resolve issues")
        );
    }
}
