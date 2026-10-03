package com.livic.core.community.announcement.security;

import com.livic.platform.auth.spi.PermissionCatalogContributor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/** Permissions on the notice board. */
@Component
@Order(60)
public class AnnouncementPermissions implements PermissionCatalogContributor {

    public static final String ANNOUNCEMENT_VIEW = "ANNOUNCEMENT_VIEW";
    public static final String ANNOUNCEMENT_CREATE = "ANNOUNCEMENT_CREATE";

    @Override
    public String module() {
        return "ANNOUNCEMENTS";
    }

    @Override
    public List<Permission> permissions() {
        return List.of(
                new Permission(ANNOUNCEMENT_VIEW, "View Announcements", "View the notice board"),
                new Permission(ANNOUNCEMENT_CREATE, "Broadcast Notices", "Post announcements to residents")
        );
    }
}
