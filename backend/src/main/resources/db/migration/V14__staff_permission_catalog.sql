-- V14__staff_permission_catalog.sql
-- Module/feature-level staff permissions (see StaffPermission enum).
-- Custom-access grants are reset: the old coarse PROPERTY_VIEW/EDIT codes used to unlock ledger, finance and
-- inventory, so owners reconfigure each staff member against the new catalog. FULL_ACCESS members are unaffected.

DELETE FROM `membership_permission_tbl`;
DELETE FROM `property_join_code_permission_tbl`;

DELETE FROM `permission_tbl`
WHERE `code` IN ('EXPENSE_CREATE', 'EXPENSE_APPROVE', 'PAYMENT_VIEW', 'PAYMENT_CREATE_OWN');

INSERT INTO `permission_tbl` (`id`, `code`, `description`)
SELECT UUID(), c.code, c.description
FROM (
  SELECT 'PROPERTY_VIEW' AS code, 'View property details, units and floors' AS description
  UNION ALL SELECT 'PROPERTY_EDIT', 'Edit property details, units and layouts'
  UNION ALL SELECT 'PROPERTY_DELETE', 'Permanently delete the property'
  UNION ALL SELECT 'LEASE_VIEW', 'View all tenant leases on the property'
  UNION ALL SELECT 'LEASE_CREATE', 'Create leases and unit bookings'
  UNION ALL SELECT 'LEASE_UPDATE', 'Update, renew or terminate leases'
  UNION ALL SELECT 'METER_READING_VIEW', 'View meter readings'
  UNION ALL SELECT 'METER_READING_CREATE', 'Record new meter readings'
  UNION ALL SELECT 'CHARGE_CONFIG_VIEW', 'View rent and utility charge setup'
  UNION ALL SELECT 'CHARGE_CONFIG_MANAGE', 'Create and edit charges'
  UNION ALL SELECT 'BILLING_WORKSHEET_VIEW', 'View billing worksheets'
  UNION ALL SELECT 'BILLING_WORKSHEET_MANAGE', 'Save billing worksheets'
  UNION ALL SELECT 'RENT_ROLL_VIEW', 'View rent cycles and invoices'
  UNION ALL SELECT 'RENT_ROLL_MANAGE', 'Generate, publish and record rent payments'
  UNION ALL SELECT 'LEDGER_VIEW', 'View the property financial ledger'
  UNION ALL SELECT 'INVENTORY_VIEW', 'View inventory items'
  UNION ALL SELECT 'INVENTORY_MANAGE', 'Add, edit and remove inventory items'
  UNION ALL SELECT 'ISSUE_VIEW', 'View tenant issues and escalations'
  UNION ALL SELECT 'ISSUE_MANAGE', 'Update, assign and resolve issues'
  UNION ALL SELECT 'ANNOUNCEMENT_VIEW', 'View the notice board'
  UNION ALL SELECT 'ANNOUNCEMENT_CREATE', 'Post announcements to tenants'
  UNION ALL SELECT 'ANALYTICS_VIEW', 'View occupancy, collections and defaulters'
  UNION ALL SELECT 'REPORTS_VIEW', 'View and export reports'
  UNION ALL SELECT 'STAFF_VIEW', 'View staff members on the property'
  UNION ALL SELECT 'MANAGE_STAFF', 'Invite staff and manage their access'
) c
WHERE NOT EXISTS (SELECT 1 FROM `permission_tbl` p WHERE p.`code` = c.code);
