package com.livic.platform.common.constant;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Catalog of permissions a CUSTOM_ACCESS staff member can be granted, grouped by app module.
 * FULL_ACCESS members implicitly hold every entry. Tenant-only codes (LEASE_VIEW_OWN, PROPERTY_VIEW_OWN_LEASE)
 * are resolved from lease ownership and are intentionally not part of this catalog.
 */
public enum StaffPermission {

    PROPERTY_VIEW(Module.PROPERTY, "View Property", "View property details, units and floors"),
    PROPERTY_EDIT(Module.PROPERTY, "Edit Property", "Edit property details, units and layouts"),
    PROPERTY_DELETE(Module.PROPERTY, "Delete Property", "Permanently delete the property"),

    LEASE_VIEW(Module.LEASES, "View Leases", "View all tenant leases on the property"),
    LEASE_CREATE(Module.LEASES, "Create Leases", "Create leases and unit bookings"),
    LEASE_UPDATE(Module.LEASES, "Update Leases", "Update, renew or terminate leases"),

    METER_READING_VIEW(Module.FINANCE, "View Meter Readings", "View meter readings"),
    METER_READING_CREATE(Module.FINANCE, "Add Meter Readings", "Record new meter readings"),
    CHARGE_CONFIG_VIEW(Module.FINANCE, "View Charge Configuration", "View rent and utility charge setup"),
    CHARGE_CONFIG_MANAGE(Module.FINANCE, "Manage Charge Configuration", "Create and edit charges"),
    BILLING_WORKSHEET_VIEW(Module.FINANCE, "View Billing Worksheets", "View billing worksheets"),
    BILLING_WORKSHEET_MANAGE(Module.FINANCE, "Manage Billing Worksheets", "Save billing worksheets"),
    RENT_ROLL_VIEW(Module.FINANCE, "View Rent Roll", "View rent cycles and invoices"),
    RENT_ROLL_MANAGE(Module.FINANCE, "Manage Rent Roll", "Generate, publish and record rent payments"),
    LEDGER_VIEW(Module.FINANCE, "View Finance Ledger", "View the property financial ledger"),

    INVENTORY_VIEW(Module.INVENTORY, "View Inventory", "View inventory items"),
    INVENTORY_MANAGE(Module.INVENTORY, "Manage Inventory", "Add, edit and remove inventory items"),

    ISSUE_VIEW(Module.ISSUES, "View Issues", "View tenant issues and escalations"),
    ISSUE_MANAGE(Module.ISSUES, "Manage Issues", "Update, assign and resolve issues"),

    ANNOUNCEMENT_VIEW(Module.ANNOUNCEMENTS, "View Announcements", "View the notice board"),
    ANNOUNCEMENT_CREATE(Module.ANNOUNCEMENTS, "Broadcast Notices", "Post announcements to tenants"),

    ANALYTICS_VIEW(Module.INSIGHTS, "View Analytics", "View occupancy, collections and defaulters"),
    REPORTS_VIEW(Module.INSIGHTS, "View Reports", "View and export reports"),

    STAFF_VIEW(Module.STAFF, "View Staff", "View staff members on the property"),
    MANAGE_STAFF(Module.STAFF, "Manage Staff", "Invite staff and manage their access");

    public enum Module { PROPERTY, LEASES, FINANCE, INVENTORY, ISSUES, ANNOUNCEMENTS, INSIGHTS, STAFF }

    private static final Set<String> ALL_CODES = Arrays.stream(values())
            .map(Enum::name)
            .collect(Collectors.toUnmodifiableSet());

    private final Module module;
    private final String label;
    private final String description;

    StaffPermission(Module module, String label, String description) {
        this.module = module;
        this.label = label;
        this.description = description;
    }

    public Module getModule() { return module; }
    public String getLabel() { return label; }
    public String getDescription() { return description; }

    public static Set<String> allCodes() {
        return ALL_CODES;
    }

    public static boolean isValid(String code) {
        return ALL_CODES.contains(code);
    }
}
