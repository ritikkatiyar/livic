package com.livic.core.finance.security;

import com.livic.platform.auth.spi.PermissionCatalogContributor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/** Permissions on charges, meter readings, worksheets, bills and the ledger. */
@Component
@Order(30)
public class FinancePermissions implements PermissionCatalogContributor {

    public static final String METER_READING_VIEW = "METER_READING_VIEW";
    public static final String METER_READING_CREATE = "METER_READING_CREATE";
    public static final String CHARGE_CONFIG_VIEW = "CHARGE_CONFIG_VIEW";
    public static final String CHARGE_CONFIG_MANAGE = "CHARGE_CONFIG_MANAGE";
    public static final String BILLING_WORKSHEET_VIEW = "BILLING_WORKSHEET_VIEW";
    public static final String BILLING_WORKSHEET_MANAGE = "BILLING_WORKSHEET_MANAGE";
    public static final String BILL_VIEW = "BILL_VIEW";
    public static final String BILL_MANAGE = "BILL_MANAGE";
    public static final String LEDGER_VIEW = "LEDGER_VIEW";

    @Override
    public String module() {
        return "FINANCE";
    }

    @Override
    public List<Permission> permissions() {
        return List.of(
                new Permission(METER_READING_VIEW, "View Meter Readings", "View meter readings"),
                new Permission(METER_READING_CREATE, "Add Meter Readings", "Record new meter readings"),
                new Permission(CHARGE_CONFIG_VIEW, "View Charge Configuration", "View the charges billed on the property"),
                new Permission(CHARGE_CONFIG_MANAGE, "Manage Charge Configuration", "Create and edit charges"),
                new Permission(BILLING_WORKSHEET_VIEW, "View Billing Worksheets", "View billing worksheets"),
                new Permission(BILLING_WORKSHEET_MANAGE, "Manage Billing Worksheets", "Save billing worksheets"),
                new Permission(BILL_VIEW, "View Bills", "View bills and invoices"),
                new Permission(BILL_MANAGE, "Manage Bills", "Generate, publish and record payments for bills"),
                new Permission(LEDGER_VIEW, "View Finance Ledger", "View the property financial ledger")
        );
    }
}
