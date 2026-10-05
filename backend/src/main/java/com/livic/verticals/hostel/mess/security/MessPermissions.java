package com.livic.verticals.hostel.mess.security;

import com.livic.platform.auth.spi.PermissionCatalogContributor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/** Permissions on a property's weekly mess menu. */
@Component
@Order(65)
public class MessPermissions implements PermissionCatalogContributor {

    public static final String MESS_VIEW = "MESS_VIEW";
    public static final String MESS_MANAGE = "MESS_MANAGE";

    @Override
    public String module() {
        return "MESS";
    }

    @Override
    public List<Permission> permissions() {
        return List.of(
                new Permission(MESS_VIEW, "View Mess Menu", "View the weekly mess menu"),
                new Permission(MESS_MANAGE, "Manage Mess Menu", "Turn the mess menu on or off and edit meals and meal times")
        );
    }
}
