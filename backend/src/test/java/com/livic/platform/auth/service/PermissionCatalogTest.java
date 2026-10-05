package com.livic.platform.auth.service;

import com.livic.core.community.analytics.security.AnalyticsPermissions;
import com.livic.core.community.announcement.security.AnnouncementPermissions;
import com.livic.core.community.issue.security.IssuePermissions;
import com.livic.core.finance.security.FinancePermissions;
import com.livic.core.property.security.PropertyPermissions;
import com.livic.platform.auth.domain.PermissionTbl;
import com.livic.platform.auth.repository.PermissionRepository;
import com.livic.platform.auth.security.StaffPermissions;
import com.livic.platform.auth.service.impl.PermissionCatalog;
import com.livic.platform.auth.spi.PermissionCatalogContributor;
import com.livic.verticals.rental.inventory.security.InventoryPermissions;
import com.livic.verticals.rental.lease.security.LeasePermissions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** The staff permission catalog is what the modules declare, merged; auth adds no codes of its own. */
class PermissionCatalogTest {

    private final PermissionRepository permissionRepository = mock(PermissionRepository.class);

    private static List<PermissionCatalogContributor> allModules() {
        return List.of(new PropertyPermissions(), new LeasePermissions(), new FinancePermissions(), new InventoryPermissions(),
                new IssuePermissions(), new AnnouncementPermissions(), new AnalyticsPermissions(), new StaffPermissions());
    }

    @Test
    @DisplayName("The modules together declare every grantable code, grouped as the staff screen shows them")
    void modulesDeclareTheWholeCatalog() {
        PermissionCatalog catalog = new PermissionCatalog(allModules(), permissionRepository);

        assertThat(catalog.modules()).extracting(PermissionCatalog.Module::module).containsExactly(
                "PROPERTY", "LEASES", "FINANCE", "INVENTORY", "ISSUES", "ANNOUNCEMENTS", "INSIGHTS", "STAFF");
        assertThat(catalog.codes()).containsExactlyInAnyOrder(
                "PROPERTY_VIEW", "PROPERTY_EDIT", "PROPERTY_DELETE",
                "LEASE_VIEW", "LEASE_CREATE", "LEASE_UPDATE",
                "METER_READING_VIEW", "METER_READING_CREATE", "CHARGE_CONFIG_VIEW", "CHARGE_CONFIG_MANAGE",
                "BILLING_WORKSHEET_VIEW", "BILLING_WORKSHEET_MANAGE", "BILL_VIEW", "BILL_MANAGE", "LEDGER_VIEW",
                "INVENTORY_VIEW", "INVENTORY_MANAGE",
                "ISSUE_VIEW", "ISSUE_MANAGE",
                "ANNOUNCEMENT_VIEW", "ANNOUNCEMENT_CREATE",
                "ANALYTICS_VIEW", "REPORTS_VIEW",
                "STAFF_VIEW", "MANAGE_STAFF");
        assertThat(catalog.isGrantable("BILL_VIEW_OWN")).isFalse();
    }

    @Test
    @DisplayName("A self-service code cannot be declared grantable")
    void ownCodesAreRejected() {
        assertThatThrownBy(() -> new PermissionCatalog(List.of(module("LEASES", "LEASE_VIEW_OWN")), permissionRepository))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("LEASE_VIEW_OWN");
    }

    @Test
    @DisplayName("Two modules cannot declare the same code")
    void duplicateCodesAreRejected() {
        assertThatThrownBy(() -> new PermissionCatalog(
                List.of(module("FINANCE", "BILL_VIEW"), module("LEASES", "BILL_VIEW")), permissionRepository))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("BILL_VIEW");
    }

    @Test
    @SuppressWarnings("unchecked")
    @DisplayName("A newly declared code gets its permission row, so it can be granted straight away")
    void missingCodesAreRegistered() {
        when(permissionRepository.findByCodeIn(any())).thenReturn(
                List.of(PermissionTbl.builder().code("BILL_VIEW").build()));
        PermissionCatalog catalog = new PermissionCatalog(
                List.of(module("FINANCE", "BILL_VIEW"), module("PARKING", "PARKING_MANAGE")), permissionRepository);

        catalog.registerMissingPermissions();

        ArgumentCaptor<List<PermissionTbl>> saved = ArgumentCaptor.forClass(List.class);
        verify(permissionRepository).saveAll(saved.capture());
        assertThat(saved.getValue()).extracting(PermissionTbl::getCode).containsExactly("PARKING_MANAGE");
    }

    private static PermissionCatalogContributor module(String module, String code) {
        return new PermissionCatalogContributor() {
            @Override
            public String module() {
                return module;
            }

            @Override
            public List<Permission> permissions() {
                return List.of(new Permission(code, code, code));
            }
        };
    }
}
