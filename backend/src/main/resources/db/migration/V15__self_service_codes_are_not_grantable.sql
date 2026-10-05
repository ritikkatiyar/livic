-- Self-service codes (…_OWN) are held by the user a resource belongs to, never granted, and the
-- modules declare only grantable codes. Remove the rows the seed added for them.
DELETE FROM property_join_code_permission_tbl
WHERE permission_code IN ('LEASE_VIEW_OWN', 'PROPERTY_VIEW_OWN_LEASE', 'PAYMENT_CREATE_OWN');

-- membership_permission_tbl rows go with them (ON DELETE CASCADE).
DELETE FROM permission_tbl
WHERE code IN ('LEASE_VIEW_OWN', 'PROPERTY_VIEW_OWN_LEASE', 'PAYMENT_CREATE_OWN');
