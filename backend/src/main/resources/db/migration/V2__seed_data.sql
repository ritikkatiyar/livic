-- V2__seed_data.sql
-- Seed data for TenantLiving / Property Management System

-- 1. Seed Default Super Admin User
INSERT INTO user_tbl (
    id,
    auth_uid,
    full_name,
    phone_number,
    password_hash,
    failed_login_attempts,
    lockout_until,
    global_role
) VALUES (
    '51b21b41-22f7-44a6-ba3e-1e03421d46ea',
    'super@duper.com',
    'SuperDuperMan',
    '9658742346',
    '$2a$10$iF2sCXo.GR6uLLooK5FiHubhCvAY8xAr3mYmCIQDEgFuTvOK/PCzq',
    0,
    NULL,
    'SUPER_ADMIN'
);

-- 2. Seed Subscription Plans with fixed UUIDs
INSERT INTO subscription_plan_tbl (id, plan_key, name, price_monthly, price_yearly, currency, is_active) VALUES
('10000000-0000-0000-0000-000000000001', 'STARTER', 'Starter (Free)', 0.00, 0.00, 'INR', TRUE),
('10000000-0000-0000-0000-000000000002', 'BASIC', 'Basic Landlord', 799.00, 7670.00, 'INR', TRUE),
('10000000-0000-0000-0000-000000000003', 'PREMIUM', 'Premium Portfolio', 1599.00, 15350.00, 'INR', TRUE),
('10000000-0000-0000-0000-000000000004', 'ENTERPRISE', 'Enterprise Unlimited', 3999.00, 38390.00, 'INR', TRUE);

-- 3. Seed Plan Feature Limits using static plan IDs
INSERT INTO plan_feature_limit_tbl (id, plan_id, feature_key, limit_value) VALUES
-- STARTER
(UUID(), '10000000-0000-0000-0000-000000000001', 'MAX_PROPERTIES', 1),
(UUID(), '10000000-0000-0000-0000-000000000001', 'MAX_UNITS', 5),
(UUID(), '10000000-0000-0000-0000-000000000001', 'MAX_TEAM_MEMBERS', 1),
(UUID(), '10000000-0000-0000-0000-000000000001', 'AI_CREDITS_MONTHLY', 50),
(UUID(), '10000000-0000-0000-0000-000000000001', 'COMMAND_CENTER_3D', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'CUSTOM_CHARGE_TYPES', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'BATCH_RENT_GENERATION', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'BILLING_WORKSHEET', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'FINANCIAL_LEDGER', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'PREMIUM_EXPENSE_SPLIT', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'INVOICE_PDF', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'CUSTOM_ROLES', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'FINE_GRAINED_PERMISSIONS', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'TARGETED_ANNOUNCEMENTS', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'ADVANCED_ANALYTICS', 0),
(UUID(), '10000000-0000-0000-0000-000000000001', 'ADVANCED_REPORTS', 0),
-- BASIC
(UUID(), '10000000-0000-0000-0000-000000000002', 'MAX_PROPERTIES', 3),
(UUID(), '10000000-0000-0000-0000-000000000002', 'MAX_UNITS', 25),
(UUID(), '10000000-0000-0000-0000-000000000002', 'MAX_TEAM_MEMBERS', 3),
(UUID(), '10000000-0000-0000-0000-000000000002', 'AI_CREDITS_MONTHLY', 200),
(UUID(), '10000000-0000-0000-0000-000000000002', 'COMMAND_CENTER_3D', 0),
(UUID(), '10000000-0000-0000-0000-000000000002', 'CUSTOM_CHARGE_TYPES', 1),
(UUID(), '10000000-0000-0000-0000-000000000002', 'BATCH_RENT_GENERATION', 1),
(UUID(), '10000000-0000-0000-0000-000000000002', 'BILLING_WORKSHEET', 0),
(UUID(), '10000000-0000-0000-0000-000000000002', 'FINANCIAL_LEDGER', 0),
(UUID(), '10000000-0000-0000-0000-000000000002', 'PREMIUM_EXPENSE_SPLIT', 0),
(UUID(), '10000000-0000-0000-0000-000000000002', 'INVOICE_PDF', 1),
(UUID(), '10000000-0000-0000-0000-000000000002', 'CUSTOM_ROLES', 0),
(UUID(), '10000000-0000-0000-0000-000000000002', 'FINE_GRAINED_PERMISSIONS', 0),
(UUID(), '10000000-0000-0000-0000-000000000002', 'TARGETED_ANNOUNCEMENTS', 1),
(UUID(), '10000000-0000-0000-0000-000000000002', 'ADVANCED_ANALYTICS', 0),
(UUID(), '10000000-0000-0000-0000-000000000002', 'ADVANCED_REPORTS', 0),
-- PREMIUM
(UUID(), '10000000-0000-0000-0000-000000000003', 'MAX_PROPERTIES', 10),
(UUID(), '10000000-0000-0000-0000-000000000003', 'MAX_UNITS', 100),
(UUID(), '10000000-0000-0000-0000-000000000003', 'MAX_TEAM_MEMBERS', 10),
(UUID(), '10000000-0000-0000-0000-000000000003', 'AI_CREDITS_MONTHLY', 1000),
(UUID(), '10000000-0000-0000-0000-000000000003', 'COMMAND_CENTER_3D', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'CUSTOM_CHARGE_TYPES', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'BATCH_RENT_GENERATION', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'BILLING_WORKSHEET', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'FINANCIAL_LEDGER', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'PREMIUM_EXPENSE_SPLIT', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'INVOICE_PDF', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'CUSTOM_ROLES', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'FINE_GRAINED_PERMISSIONS', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'TARGETED_ANNOUNCEMENTS', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'ADVANCED_ANALYTICS', 1),
(UUID(), '10000000-0000-0000-0000-000000000003', 'ADVANCED_REPORTS', 1),
-- ENTERPRISE
(UUID(), '10000000-0000-0000-0000-000000000004', 'MAX_PROPERTIES', -1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'MAX_UNITS', -1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'MAX_TEAM_MEMBERS', -1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'AI_CREDITS_MONTHLY', -1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'COMMAND_CENTER_3D', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'CUSTOM_CHARGE_TYPES', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'BATCH_RENT_GENERATION', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'BILLING_WORKSHEET', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'FINANCIAL_LEDGER', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'PREMIUM_EXPENSE_SPLIT', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'INVOICE_PDF', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'CUSTOM_ROLES', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'FINE_GRAINED_PERMISSIONS', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'TARGETED_ANNOUNCEMENTS', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'ADVANCED_ANALYTICS', 1),
(UUID(), '10000000-0000-0000-0000-000000000004', 'ADVANCED_REPORTS', 1);

-- 4. Seed Permissions
INSERT INTO permission_tbl (id, code, description) VALUES
(UUID(), 'PROPERTY_VIEW', 'Can view property details'),
(UUID(), 'PROPERTY_EDIT', 'Can edit property details'),
(UUID(), 'PROPERTY_DELETE', 'Can delete property'),
(UUID(), 'LEASE_CREATE', 'Can create leases'),
(UUID(), 'LEASE_UPDATE', 'Can update leases'),
(UUID(), 'LEASE_VIEW', 'Can view all leases'),
(UUID(), 'LEASE_VIEW_OWN', 'Can view own lease'),
(UUID(), 'EXPENSE_CREATE', 'Can create expenses'),
(UUID(), 'EXPENSE_APPROVE', 'Can approve expenses'),
(UUID(), 'PAYMENT_VIEW', 'Can view all payments'),
(UUID(), 'PAYMENT_CREATE_OWN', 'Can create own payments'),
(UUID(), 'ANNOUNCEMENT_CREATE', 'Can create announcements'),
(UUID(), 'MANAGE_STAFF', 'Can assign/remove manager and caretaker roles on property'),
(UUID(), 'PROPERTY_VIEW_OWN_LEASE', 'Can view own lease details as tenant');


-- 5. Seed Mom's PG Load Stored Procedure
DELIMITER //

CREATE PROCEDURE seed_moms_pg_load_data()
BEGIN
    DECLARE owner_id VARCHAR(36);
    DECLARE curr_manager_id VARCHAR(36);
    DECLARE curr_caretaker_id VARCHAR(36);
    DECLARE password_hash VARCHAR(255);
    
    DECLARE b INT DEFAULT 1;
    DECLARE f INT DEFAULT 1;
    DECLARE r INT DEFAULT 1;
    
    DECLARE prop_id VARCHAR(36);
    DECLARE curr_block_id VARCHAR(36);
    DECLARE unit_num VARCHAR(10);
    DECLARE curr_unit_id VARCHAR(36);
    DECLARE curr_tenant_id VARCHAR(36);
    DECLARE curr_lease_id VARCHAR(36);
    DECLARE curr_member_id VARCHAR(36);
    
    SET owner_id = 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e';
    SET password_hash = '$2a$10$iF2sCXo.GR6uLLooK5FiHubhCvAY8xAr3mYmCIQDEgFuTvOK/PCzq'; -- 'Adm!n@super'
    
    -- 1. Insert Owner User
    INSERT INTO user_tbl (id, auth_uid, full_name, phone_number, password_hash, global_role) VALUES
    (owner_id, 'owner@moms.com', 'Mom\'s Owner', '9999999991', password_hash, 'USER');
    
    -- 2. Add User Preferences for Dashboard Active Modes
    INSERT INTO user_preference_tbl (id, user_id, active_mode, onboarding_done) VALUES
    (UUID(), owner_id, 'RENTAL', TRUE);
    
    -- 3. Loop 10 Buildings
    WHILE b <= 10 DO
        SET prop_id = UUID();
        SET curr_manager_id = UUID();
        SET curr_caretaker_id = UUID();
        
        -- Insert distinct Manager and Caretaker for Building b
        INSERT INTO user_tbl (id, auth_uid, full_name, phone_number, password_hash, global_role) VALUES
        (curr_manager_id, CONCAT('manager_', b, '@moms.com'), CONCAT('Mom\'s Manager ', b), CONCAT('98000000', LPAD(b, 2, '0')), password_hash, 'USER'),
        (curr_caretaker_id, CONCAT('caretaker_', b, '@moms.com'), CONCAT('Mom\'s Caretaker ', b), CONCAT('97000000', LPAD(b, 2, '0')), password_hash, 'USER');
        
        -- Add User Preferences
        INSERT INTO user_preference_tbl (id, user_id, active_mode, onboarding_done) VALUES
        (UUID(), curr_manager_id, 'RENTAL', TRUE),
        (UUID(), curr_caretaker_id, 'RENTAL', TRUE);
        
        -- Insert Property
        INSERT INTO property_tbl (id, name, city, address, is_active, allow_partial_payment, auto_bill_day_of_month, auto_bill_time)
        VALUES (prop_id, CONCAT('mom\'s pg ', b), 'New York', CONCAT('Address Building ', b), TRUE, TRUE, 1, '09:00:00');
        
        -- Default block: rental properties keep one the apps never show
        SET curr_block_id = UUID();
        INSERT INTO block_tbl (id, property_id, name, sort_order, is_default, total_floors)
        VALUES (curr_block_id, prop_id, 'Main', 0, TRUE, 5);
        
        -- Map Owner, Manager, Caretaker to this specific Building
        INSERT INTO membership_tbl (id, user_id, property_id, title, access_type, is_active) VALUES
        (UUID(), owner_id, prop_id, 'Owner', 'FULL_ACCESS', TRUE),
        (UUID(), curr_manager_id, prop_id, 'Manager', 'CUSTOM_ACCESS', TRUE),
        (UUID(), curr_caretaker_id, prop_id, 'Caretaker', 'CUSTOM_ACCESS', TRUE);
        
        -- Insert Base Rent Charge Configuration for this Building
        INSERT INTO charge_config_tbl (id, property_id, charge_name, charge_category, billing_frequency, calculation_strategy, base_rate, apply_sales_tax, is_system_required, is_active, auto_carry_forward)
        VALUES (UUID(), prop_id, 'Base Rent', 'RENT', 'MONTHLY', 'FIXED_RATE', NULL, FALSE, TRUE, TRUE, FALSE);
        
        -- Loop 5 Floors
        SET f = 1;
        WHILE f <= 5 DO
            -- Loop 20 Rooms per floor
            SET r = 1;
            WHILE r <= 20 DO
                SET unit_num = CONCAT(f, LPAD(r, 2, '0'));
                SET curr_unit_id = UUID();
                
                -- Create Unit
                INSERT INTO unit_tbl (id, property_id, block_id, unit_number, floor, capacity, type, grid_x, grid_y, grid_width, grid_height)
                VALUES (curr_unit_id, prop_id, curr_block_id, unit_num, f, 2, 'SHARED_UNIT', r, f, 1, 1);
                
                -- Create Tenant 1 for this unit
                SET curr_tenant_id = UUID();
                INSERT INTO user_tbl (id, auth_uid, full_name, phone_number, password_hash, global_role)
                VALUES (curr_tenant_id, CONCAT('tenant_', b, '_', f, '_', r, '_1@moms.com'), CONCAT('Tenant ', b, '-', unit_num, ' A'), CONCAT('9', LPAD(b, 2, '0'), f, LPAD(r, 2, '0'), '1'), password_hash, 'USER');
                
                SET curr_lease_id = UUID();
                INSERT INTO lease_tbl (id, unit_id, user_id, monthly_rent_amount, security_deposit, move_in_date, status, split_strategy)
                VALUES (curr_lease_id, curr_unit_id, curr_tenant_id, 1000.00, 2000.00, '2026-08-01', 'ACTIVE', 'FULL_UNIT');
                
                INSERT INTO unit_member_tbl (id, unit_id, user_id, role, is_primary, lease_id, from_date, is_active)
                VALUES (UUID(), curr_unit_id, curr_tenant_id, 'TENANT', TRUE, curr_lease_id, '2026-08-01', TRUE);
                
                -- Create Tenant 2 for this unit
                SET curr_tenant_id = UUID();
                INSERT INTO user_tbl (id, auth_uid, full_name, phone_number, password_hash, global_role)
                VALUES (curr_tenant_id, CONCAT('tenant_', b, '_', f, '_', r, '_2@moms.com'), CONCAT('Tenant ', b, '-', unit_num, ' B'), CONCAT('9', LPAD(b, 2, '0'), f, LPAD(r, 2, '0'), '2'), password_hash, 'USER');
                
                SET curr_lease_id = UUID();
                INSERT INTO lease_tbl (id, unit_id, user_id, monthly_rent_amount, security_deposit, move_in_date, status, split_strategy)
                VALUES (curr_lease_id, curr_unit_id, curr_tenant_id, 1000.00, 2000.00, '2026-08-01', 'ACTIVE', 'FULL_UNIT');
                
                INSERT INTO unit_member_tbl (id, unit_id, user_id, role, is_primary, lease_id, from_date, is_active)
                VALUES (UUID(), curr_unit_id, curr_tenant_id, 'TENANT', TRUE, curr_lease_id, '2026-08-01', TRUE);
                
                SET r = r + 1;
            END WHILE;
            SET f = f + 1;
        END WHILE;
        
        SET b = b + 1;
    END WHILE;
END //

DELIMITER ;

CALL seed_moms_pg_load_data();
DROP PROCEDURE seed_moms_pg_load_data;


-- 6. Seed Livic Residency (1 Owner, 1 Caretaker, 1 Property, 5 Floors, 2 Units per floor, Rent: 1000, Security: 2000)
DELIMITER //

CREATE PROCEDURE seed_livic_residency_data()
BEGIN
    DECLARE owner_id VARCHAR(36);
    DECLARE caretaker_id VARCHAR(36);
    DECLARE prop_id VARCHAR(36);
    DECLARE curr_block_id VARCHAR(36);
    DECLARE block_b_id VARCHAR(36);
    DECLARE charge_cfg_id VARCHAR(36);
    DECLARE password_hash VARCHAR(255);
    
    DECLARE f INT DEFAULT 1;
    DECLARE u INT DEFAULT 1;
    DECLARE unit_num VARCHAR(10);
    DECLARE curr_unit_id VARCHAR(36);
    DECLARE curr_tenant_id VARCHAR(36);
    DECLARE curr_lease_id VARCHAR(36);
    DECLARE curr_member_id VARCHAR(36);

    DECLARE cycle_id_may VARCHAR(36);
    DECLARE cycle_id_jun VARCHAR(36);
    DECLARE cycle_id_jul VARCHAR(36);
    DECLARE cycle_id_aug VARCHAR(36);
    DECLARE cycle_id_sep VARCHAR(36);
    DECLARE tx_id_may VARCHAR(36);
    DECLARE tx_id_jun VARCHAR(36);
    DECLARE tx_id_jul VARCHAR(36);
    DECLARE tx_id_aug VARCHAR(36);
    
    SET owner_id = 'e2d3c4b5-a6f7-8b9c-0d1e-3f4a5b6c7d8e';
    SET caretaker_id = 'f3e4d5c6-b7a8-9c0d-1e2f-4a5b6c7d8e9f';
    SET prop_id = 'a1b2c3d4-e5f6-7a8b-9c0d-2e3f4a5b6c7d';
    SET charge_cfg_id = UUID();
    SET password_hash = '$2a$10$iF2sCXo.GR6uLLooK5FiHubhCvAY8xAr3mYmCIQDEgFuTvOK/PCzq'; -- 'Adm!n@super'
    
    -- 1. Insert Owner and Caretaker Users
    INSERT INTO user_tbl (id, auth_uid, full_name, phone_number, password_hash, global_role) VALUES
    (owner_id, 'owner@livic.com', 'Livic Owner', '9999999981', password_hash, 'USER'),
    (caretaker_id, 'caretaker@livic.com', 'Livic Caretaker', '9999999982', password_hash, 'USER');
    
    -- 2. Insert User Preferences for Dashboard Active Modes
    INSERT INTO user_preference_tbl (id, user_id, active_mode, onboarding_done) VALUES
    (UUID(), owner_id, 'RENTAL', TRUE),
    (UUID(), caretaker_id, 'RENTAL', TRUE);
    
    -- 3. Insert Property (5 floors)
    INSERT INTO property_tbl (id, name, city, address, is_active, allow_partial_payment, auto_bill_day_of_month, auto_bill_time)
    VALUES (prop_id, 'Livic Residency', 'Bangalore', '100 Feet Road, Indiranagar', TRUE, TRUE, 1, '09:00:00');
    
    -- Two blocks, so the multi-block case is reachable without hand-built data. Tower A is
    -- the default block every property gets; it is named properly here because this property
    -- has a second one.
    SET curr_block_id = UUID();
    INSERT INTO block_tbl (id, property_id, name, sort_order, is_default, total_floors)
    VALUES (curr_block_id, prop_id, 'Tower A', 0, TRUE, 5);

    SET block_b_id = UUID();
    INSERT INTO block_tbl (id, property_id, name, sort_order, is_default, total_floors)
    VALUES (block_b_id, prop_id, 'Tower B', 1, FALSE, 2);

    -- Tower B repeats Tower A's unit numbers on purpose: they are unique per block, not per
    -- property, and this is what proves it. Left vacant, with no leases or bills.
    INSERT INTO unit_tbl (id, property_id, block_id, unit_number, floor, capacity, type, grid_x, grid_y, grid_width, grid_height) VALUES
    (UUID(), prop_id, block_b_id, '101', 1, 1, 'SINGLE_UNIT', 1, 1, 1, 1),
    (UUID(), prop_id, block_b_id, '102', 1, 1, 'SINGLE_UNIT', 2, 1, 1, 1),
    (UUID(), prop_id, block_b_id, '201', 2, 1, 'SINGLE_UNIT', 1, 1, 1, 1);
    
    -- 4. Map Owner (FULL_ACCESS) and Caretaker (CUSTOM_ACCESS) to this Property
    INSERT INTO membership_tbl (id, user_id, property_id, title, access_type, is_active) VALUES
    (UUID(), owner_id, prop_id, 'Owner', 'FULL_ACCESS', TRUE),
    (UUID(), caretaker_id, prop_id, 'Caretaker', 'CUSTOM_ACCESS', TRUE);
    
    -- 5. Insert Base Rent Charge Configuration for this Property
    INSERT INTO charge_config_tbl (id, property_id, charge_name, charge_category, billing_frequency, calculation_strategy, base_rate, apply_sales_tax, is_system_required, is_active, auto_carry_forward)
    VALUES (charge_cfg_id, prop_id, 'Base Rent', 'RENT', 'MONTHLY', 'FIXED_RATE', 1000.00, FALSE, TRUE, TRUE, FALSE);
    
    -- 6. Loop 5 Floors, 2 Units per Floor (Total 10 units)
    WHILE f <= 5 DO
        SET u = 1;
        WHILE u <= 2 DO
            SET unit_num = CONCAT(f, '0', u);
            SET curr_unit_id = UUID();
            
            -- Create Unit
            INSERT INTO unit_tbl (id, property_id, block_id, unit_number, floor, capacity, type, grid_x, grid_y, grid_width, grid_height)
            VALUES (curr_unit_id, prop_id, curr_block_id, unit_num, f, 1, 'SINGLE_UNIT', u, 1, 1, 1);
            
            -- Create Tenant for this unit
            SET curr_tenant_id = UUID();
            INSERT INTO user_tbl (id, auth_uid, full_name, phone_number, password_hash, global_role)
            VALUES (curr_tenant_id, CONCAT('tenant_', unit_num, '@livic.com'), CONCAT('Tenant ', unit_num), CONCAT('9988000', unit_num), password_hash, 'USER');
            
            -- Create Active Lease (Rent: 1000, Security: 2000, Move-in: 2026-05-01)
            SET curr_lease_id = UUID();
            INSERT INTO lease_tbl (id, unit_id, user_id, monthly_rent_amount, security_deposit, move_in_date, status, split_strategy)
            VALUES (curr_lease_id, curr_unit_id, curr_tenant_id, 1000.00, 2000.00, '2026-05-01', 'ACTIVE', 'FULL_UNIT');
            
            -- The tenant is a member of the unit; this is what notices, issues and the
            -- resident context read, and it is created with the lease in real flows.
            SET curr_member_id = UUID();
            INSERT INTO unit_member_tbl (id, unit_id, user_id, role, is_primary, lease_id, from_date, is_active)
            VALUES (curr_member_id, curr_unit_id, curr_tenant_id, 'TENANT', TRUE, curr_lease_id, '2026-05-01', TRUE);
            
            -- Month 1: May 2026 (PAID)
            SET cycle_id_may = UUID();
            SET tx_id_may = UUID();
            INSERT INTO payment_transaction_tbl (id, payer_user_id, payment_method, reference_type, reference_id, gateway_name, gateway_transaction_id, amount, status, confirmed_by, confirmed_at, note, created_at, updated_at)
            VALUES (tx_id_may, curr_tenant_id, 'ONLINE_UPI', 'BILL', cycle_id_may, 'RAZORPAY', CONCAT('pay_may_', unit_num, '_', SUBSTRING(UUID(), 1, 8)), 1000.00, 'SUCCESS', owner_id, '2026-05-03 10:30:00', 'Rent Payment May 2026', '2026-05-03 10:30:00', '2026-05-03 10:30:00');
            
            INSERT INTO bill_tbl (id, property_id, member_id, bill_type, billing_month, due_date, status, paid_at, created_at, updated_at, total_amount, amount_paid)
            VALUES (cycle_id_may, prop_id, curr_member_id, 'RENT', '2026-05', '2026-05-05', 'PAID', '2026-05-03 10:30:00', '2026-05-01 09:00:00', '2026-05-03 10:30:00', 1000.00, 1000.00);
            
            INSERT INTO bill_line_tbl (id, bill_id, charge_type, amount, description, charge_config_id)
            VALUES (UUID(), cycle_id_may, 'BASE_RENT', 1000.00, 'Monthly Base Rent', charge_cfg_id);

            INSERT INTO finance_ledger_tbl (id, unit_id, member_id, lease_id, transaction_type, amount, balance, reference_id, description, created_at, updated_at) VALUES
            (UUID(), curr_unit_id, curr_member_id, curr_lease_id, 'INVOICE_GENERATED', 1000.00, 1000.00, cycle_id_may, 'Invoice Generation for 2026-05', '2026-05-01 09:00:00', '2026-05-01 09:00:00'),
            (UUID(), curr_unit_id, curr_member_id, curr_lease_id, 'PAYMENT_RECEIVED', -1000.00, 0.00, tx_id_may, 'Rent Payment (Full) via RAZORPAY', '2026-05-03 10:30:00', '2026-05-03 10:30:00');

            -- Month 2: June 2026 (PAID)
            SET cycle_id_jun = UUID();
            SET tx_id_jun = UUID();
            INSERT INTO payment_transaction_tbl (id, payer_user_id, payment_method, reference_type, reference_id, gateway_name, gateway_transaction_id, amount, status, confirmed_by, confirmed_at, note, created_at, updated_at)
            VALUES (tx_id_jun, curr_tenant_id, 'ONLINE_UPI', 'BILL', cycle_id_jun, 'RAZORPAY', CONCAT('pay_jun_', unit_num, '_', SUBSTRING(UUID(), 1, 8)), 1000.00, 'SUCCESS', owner_id, '2026-06-04 14:15:00', 'Rent Payment June 2026', '2026-06-04 14:15:00', '2026-06-04 14:15:00');
            
            INSERT INTO bill_tbl (id, property_id, member_id, bill_type, billing_month, due_date, status, paid_at, created_at, updated_at, total_amount, amount_paid)
            VALUES (cycle_id_jun, prop_id, curr_member_id, 'RENT', '2026-06', '2026-06-05', 'PAID', '2026-06-04 14:15:00', '2026-06-01 09:00:00', '2026-06-04 14:15:00', 1000.00, 1000.00);
            
            INSERT INTO bill_line_tbl (id, bill_id, charge_type, amount, description, charge_config_id)
            VALUES (UUID(), cycle_id_jun, 'BASE_RENT', 1000.00, 'Monthly Base Rent', charge_cfg_id);

            INSERT INTO finance_ledger_tbl (id, unit_id, member_id, lease_id, transaction_type, amount, balance, reference_id, description, created_at, updated_at) VALUES
            (UUID(), curr_unit_id, curr_member_id, curr_lease_id, 'INVOICE_GENERATED', 1000.00, 1000.00, cycle_id_jun, 'Invoice Generation for 2026-06', '2026-06-01 09:00:00', '2026-06-01 09:00:00'),
            (UUID(), curr_unit_id, curr_member_id, curr_lease_id, 'PAYMENT_RECEIVED', -1000.00, 0.00, tx_id_jun, 'Rent Payment (Full) via RAZORPAY', '2026-06-04 14:15:00', '2026-06-04 14:15:00');

            -- Month 3: July 2026 (PAID)
            SET cycle_id_jul = UUID();
            SET tx_id_jul = UUID();
            INSERT INTO payment_transaction_tbl (id, payer_user_id, payment_method, reference_type, reference_id, gateway_name, gateway_transaction_id, amount, status, confirmed_by, confirmed_at, note, created_at, updated_at)
            VALUES (tx_id_jul, curr_tenant_id, 'ONLINE_UPI', 'BILL', cycle_id_jul, 'RAZORPAY', CONCAT('pay_jul_', unit_num, '_', SUBSTRING(UUID(), 1, 8)), 1000.00, 'SUCCESS', owner_id, '2026-07-02 09:45:00', 'Rent Payment July 2026', '2026-07-02 09:45:00', '2026-07-02 09:45:00');
            
            INSERT INTO bill_tbl (id, property_id, member_id, bill_type, billing_month, due_date, status, paid_at, created_at, updated_at, total_amount, amount_paid)
            VALUES (cycle_id_jul, prop_id, curr_member_id, 'RENT', '2026-07', '2026-07-05', 'PAID', '2026-07-02 09:45:00', '2026-07-01 09:00:00', '2026-07-02 09:45:00', 1000.00, 1000.00);
            
            INSERT INTO bill_line_tbl (id, bill_id, charge_type, amount, description, charge_config_id)
            VALUES (UUID(), cycle_id_jul, 'BASE_RENT', 1000.00, 'Monthly Base Rent', charge_cfg_id);

            INSERT INTO finance_ledger_tbl (id, unit_id, member_id, lease_id, transaction_type, amount, balance, reference_id, description, created_at, updated_at) VALUES
            (UUID(), curr_unit_id, curr_member_id, curr_lease_id, 'INVOICE_GENERATED', 1000.00, 1000.00, cycle_id_jul, 'Invoice Generation for 2026-07', '2026-07-01 09:00:00', '2026-07-01 09:00:00'),
            (UUID(), curr_unit_id, curr_member_id, curr_lease_id, 'PAYMENT_RECEIVED', -1000.00, 0.00, tx_id_jul, 'Rent Payment (Full) via RAZORPAY', '2026-07-02 09:45:00', '2026-07-02 09:45:00');

            -- Month 4: August 2026 (PAID)
            SET cycle_id_aug = UUID();
            SET tx_id_aug = UUID();
            INSERT INTO payment_transaction_tbl (id, payer_user_id, payment_method, reference_type, reference_id, gateway_name, gateway_transaction_id, amount, status, confirmed_by, confirmed_at, note, created_at, updated_at)
            VALUES (tx_id_aug, curr_tenant_id, 'ONLINE_UPI', 'BILL', cycle_id_aug, 'RAZORPAY', CONCAT('pay_aug_', unit_num, '_', SUBSTRING(UUID(), 1, 8)), 1000.00, 'SUCCESS', owner_id, '2026-08-05 16:20:00', 'Rent Payment August 2026', '2026-08-05 16:20:00', '2026-08-05 16:20:00');
            
            INSERT INTO bill_tbl (id, property_id, member_id, bill_type, billing_month, due_date, status, paid_at, created_at, updated_at, total_amount, amount_paid)
            VALUES (cycle_id_aug, prop_id, curr_member_id, 'RENT', '2026-08', '2026-08-05', 'PAID', '2026-08-05 16:20:00', '2026-08-01 09:00:00', '2026-08-05 16:20:00', 1000.00, 1000.00);
            
            INSERT INTO bill_line_tbl (id, bill_id, charge_type, amount, description, charge_config_id)
            VALUES (UUID(), cycle_id_aug, 'BASE_RENT', 1000.00, 'Monthly Base Rent', charge_cfg_id);

            INSERT INTO finance_ledger_tbl (id, unit_id, member_id, lease_id, transaction_type, amount, balance, reference_id, description, created_at, updated_at) VALUES
            (UUID(), curr_unit_id, curr_member_id, curr_lease_id, 'INVOICE_GENERATED', 1000.00, 1000.00, cycle_id_aug, 'Invoice Generation for 2026-08', '2026-08-01 09:00:00', '2026-08-01 09:00:00'),
            (UUID(), curr_unit_id, curr_member_id, curr_lease_id, 'PAYMENT_RECEIVED', -1000.00, 0.00, tx_id_aug, 'Rent Payment (Full) via RAZORPAY', '2026-08-05 16:20:00', '2026-08-05 16:20:00');

            -- Current Month: September 2026 (PUBLISHED, Due Soon)
            SET cycle_id_sep = UUID();
            INSERT INTO bill_tbl (id, property_id, member_id, bill_type, billing_month, due_date, status, paid_at, created_at, updated_at, total_amount, amount_paid)
            VALUES (cycle_id_sep, prop_id, curr_member_id, 'RENT', '2026-09', '2026-09-10', 'PUBLISHED', NULL, '2026-09-01 09:00:00', '2026-09-01 09:00:00', 1000.00, 0.00);
            
            INSERT INTO bill_line_tbl (id, bill_id, charge_type, amount, description, charge_config_id)
            VALUES (UUID(), cycle_id_sep, 'BASE_RENT', 1000.00, 'Monthly Base Rent', charge_cfg_id);

            INSERT INTO finance_ledger_tbl (id, unit_id, member_id, lease_id, transaction_type, amount, balance, reference_id, description, created_at, updated_at)
            VALUES (UUID(), curr_unit_id, curr_member_id, curr_lease_id, 'INVOICE_GENERATED', 1000.00, 1000.00, cycle_id_sep, 'Invoice Generation for 2026-09', '2026-09-01 09:00:00', '2026-09-01 09:00:00');

            -- Notification Delivery Logs for September Invoice & August Settlement
            INSERT INTO notification_log_tbl (id, recipient_id, channel, recipient_address, title, body, status, created_at, updated_at) VALUES
            (UUID(), curr_tenant_id, 'EMAIL', CONCAT('tenant_', unit_num, '@livic.com'), 'Rent Published for September 2026', 'Your rent for September 2026 is due on 10 Sep 2026. Total Amount: ₹1,000.00', 'SENT', '2026-09-01 09:05:00', '2026-09-01 09:05:00'),
            (UUID(), curr_tenant_id, 'EMAIL', CONCAT('tenant_', unit_num, '@livic.com'), 'Rent Payment Receipt - August 2026', 'Your rent payment of ₹1,000.00 for August 2026 has been successfully received.', 'SENT', '2026-08-05 16:22:00', '2026-08-05 16:22:00');
            
            SET u = u + 1;
        END WHILE;
        SET f = f + 1;
    END WHILE;
END //

DELIMITER ;

CALL seed_livic_residency_data();
DROP PROCEDURE seed_livic_residency_data;

-- ---------------------------------------------------------------------------
-- 7. Staff permission catalog (was V14)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 8. Property amenities (was V10)
-- ---------------------------------------------------------------------------

INSERT IGNORE INTO property_amenities_tbl (property_id, amenity)
SELECT id, 'High-speed Fiber Wi-Fi' FROM property_tbl
UNION ALL
SELECT id, 'Rooftop Pool' FROM property_tbl
UNION ALL
SELECT id, 'Covered Parking' FROM property_tbl
UNION ALL
SELECT id, '24/7 Fitness Center' FROM property_tbl
UNION ALL
SELECT id, '24/7 Security' FROM property_tbl
UNION ALL
SELECT id, 'Power Backup' FROM property_tbl;

-- ---------------------------------------------------------------------------
-- 9. Marketplace listings: prices, bookability, descriptions and photos (was V20)
-- ---------------------------------------------------------------------------
-- Flyway Migration V20: Marketplace listing seed data (prices, bookability, descriptions and photos)
-- Targets only the demo properties created by V2 (matched by name), so it is a no-op on databases without them.

-- 1. Property descriptions
UPDATE property_tbl
SET description = 'Premium single-occupancy residences on 100 Feet Road, Indiranagar. Fully managed with 24/7 security, power backup and a rooftop pool, a short walk from the metro.'
WHERE name = 'Livic Residency' AND description IS NULL;

UPDATE property_tbl
SET description = CONCAT(name, ' offers comfortable twin-sharing rooms with home-style meals, daily housekeeping and high-speed Wi-Fi. Ideal for students and young professionals.')
WHERE name LIKE 'mom''s pg %' AND description IS NULL;

-- 2. Unit pricing, bookability, descriptions and amenities
-- Livic Residency: single units priced by floor (₹13,000 - ₹17,000); the second unit on each floor is open for instant booking
UPDATE unit_tbl u
JOIN property_tbl p ON p.id = u.property_id
SET u.base_price  = 12000 + (u.floor * 1000),
    u.is_bookable = (u.unit_number LIKE '%2'),
    u.description = CONCAT('Furnished single room on floor ', u.floor, ' with an attached bathroom, wardrobe and study desk.'),
    u.amenities   = JSON_ARRAY('Attached Bathroom', 'Air Conditioning', 'Study Desk', 'Wardrobe')
WHERE p.name = 'Livic Residency' AND u.base_price IS NULL;

-- mom's pg N: twin-sharing units priced by PG number and floor (₹5,900 - ₹8,500); every fifth unit is open for instant booking
UPDATE unit_tbl u
JOIN property_tbl p ON p.id = u.property_id
SET u.base_price  = 5500 + (CAST(SUBSTRING_INDEX(p.name, ' ', -1) AS UNSIGNED) * 250) + (u.floor * 150),
    u.is_bookable = (MOD(CAST(u.unit_number AS UNSIGNED), 5) = 0),
    u.description = CONCAT('Twin-sharing room on floor ', u.floor, ' with two beds, individual lockers and shared bathroom access.'),
    u.amenities   = JSON_ARRAY('Twin Beds', 'Personal Locker', 'Meals Included', 'Housekeeping')
WHERE p.name LIKE 'mom''s pg %' AND u.base_price IS NULL;

-- 3. Property photos (3 per property, rotated through a pool of building and interior shots)
INSERT INTO media_asset_tbl (id, owner_module, reference_id, storage_provider, external_id, url, file_type, caption, uploaded_by_user_id, uploaded_at, created_at, updated_at)
SELECT UUID(), 'PROPERTY', p.id, 'LOCAL', CONCAT('seed-property-', p.id, '-', slot.n),
       CONCAT('https://images.unsplash.com/', pool.photo, '?auto=format&fit=crop&w=1200&q=80'),
       'IMAGE', CONCAT(p.name, ' photo ', slot.n + 1), '51b21b41-22f7-44a6-ba3e-1e03421d46ea', NOW(6), NOW(6), NOW(6)
FROM (
    SELECT id, name, ROW_NUMBER() OVER (ORDER BY name) AS rn
    FROM property_tbl
    WHERE name = 'Livic Residency' OR name LIKE 'mom''s pg %'
) p
CROSS JOIN (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2) slot
JOIN (
    SELECT 0 AS idx, 'photo-1545324418-cc1a3fa10c00' AS photo UNION ALL
    SELECT 1, 'photo-1502672260266-1c1ef2d93688' UNION ALL
    SELECT 2, 'photo-1560448204-e02f11c3d0e2' UNION ALL
    SELECT 3, 'photo-1600585154340-be6161a56a0c' UNION ALL
    SELECT 4, 'photo-1522708323590-d24dbb6b0267' UNION ALL
    SELECT 5, 'photo-1555854877-bab0e564b8d5' UNION ALL
    SELECT 6, 'photo-1600596542815-ffad4c1539a9' UNION ALL
    SELECT 7, 'photo-1595526114035-0d45ed16cfbf' UNION ALL
    SELECT 8, 'photo-1512917774080-9991f1c4c750' UNION ALL
    SELECT 9, 'photo-1513694203232-719a280e022f'
) pool ON pool.idx = MOD(p.rn * 3 + slot.n, 10)
WHERE NOT EXISTS (
    SELECT 1 FROM media_asset_tbl m WHERE m.owner_module = 'PROPERTY' AND m.reference_id = p.id COLLATE utf8mb4_unicode_ci
);

-- 4. Unit photos (1 per unit, rotated through a pool of room interiors)
INSERT INTO media_asset_tbl (id, owner_module, reference_id, storage_provider, external_id, url, file_type, caption, uploaded_by_user_id, uploaded_at, created_at, updated_at)
SELECT UUID(), 'PROPERTY', u.id, 'LOCAL', CONCAT('seed-unit-', u.id),
       CONCAT('https://images.unsplash.com/', pool.photo, '?auto=format&fit=crop&w=1200&q=80'),
       'IMAGE', CONCAT('Unit ', u.unit_number), '51b21b41-22f7-44a6-ba3e-1e03421d46ea', NOW(6), NOW(6), NOW(6)
FROM (
    SELECT un.id, un.unit_number, ROW_NUMBER() OVER (ORDER BY pr.name, un.floor, un.unit_number) AS rn
    FROM unit_tbl un
    JOIN property_tbl pr ON pr.id = un.property_id
    WHERE pr.name = 'Livic Residency' OR pr.name LIKE 'mom''s pg %'
) u
JOIN (
    SELECT 0 AS idx, 'photo-1502672260266-1c1ef2d93688' AS photo UNION ALL
    SELECT 1, 'photo-1522708323590-d24dbb6b0267' UNION ALL
    SELECT 2, 'photo-1560448204-e02f11c3d0e2' UNION ALL
    SELECT 3, 'photo-1595526114035-0d45ed16cfbf' UNION ALL
    SELECT 4, 'photo-1555854877-bab0e564b8d5' UNION ALL
    SELECT 5, 'photo-1513694203232-719a280e022f'
) pool ON pool.idx = MOD(u.rn, 6)
WHERE NOT EXISTS (
    SELECT 1 FROM media_asset_tbl m WHERE m.owner_module = 'PROPERTY' AND m.reference_id = u.id COLLATE utf8mb4_unicode_ci
);
