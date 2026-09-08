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
    DECLARE unit_num VARCHAR(10);
    DECLARE curr_unit_id VARCHAR(36);
    DECLARE curr_tenant_id VARCHAR(36);
    
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
        INSERT INTO property_tbl (id, name, city, address, total_floors, is_active, allow_partial_payment, auto_bill_day_of_month, auto_bill_time)
        VALUES (prop_id, CONCAT('mom\'s pg ', b), 'New York', CONCAT('Address Building ', b), 5, TRUE, TRUE, 1, '09:00:00');
        
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
                INSERT INTO unit_tbl (id, property_id, unit_number, floor, capacity, type, grid_x, grid_y, grid_width, grid_height)
                VALUES (curr_unit_id, prop_id, unit_num, f, 2, 'SHARED_UNIT', r, f, 1, 1);
                
                -- Create Tenant 1 for this unit
                SET curr_tenant_id = UUID();
                INSERT INTO user_tbl (id, auth_uid, full_name, phone_number, password_hash, global_role)
                VALUES (curr_tenant_id, CONCAT('tenant_', b, '_', f, '_', r, '_1@moms.com'), CONCAT('Tenant ', b, '-', unit_num, ' A'), CONCAT('9', LPAD(b, 2, '0'), f, LPAD(r, 2, '0'), '1'), password_hash, 'USER');
                
                INSERT INTO lease_tbl (id, unit_id, user_id, monthly_rent_amount, security_deposit, move_in_date, status, split_strategy)
                VALUES (UUID(), curr_unit_id, curr_tenant_id, 1000.00, 2000.00, '2026-08-01', 'ACTIVE', 'FULL_UNIT');
                
                -- Create Tenant 2 for this unit
                SET curr_tenant_id = UUID();
                INSERT INTO user_tbl (id, auth_uid, full_name, phone_number, password_hash, global_role)
                VALUES (curr_tenant_id, CONCAT('tenant_', b, '_', f, '_', r, '_2@moms.com'), CONCAT('Tenant ', b, '-', unit_num, ' B'), CONCAT('9', LPAD(b, 2, '0'), f, LPAD(r, 2, '0'), '2'), password_hash, 'USER');
                
                INSERT INTO lease_tbl (id, unit_id, user_id, monthly_rent_amount, security_deposit, move_in_date, status, split_strategy)
                VALUES (UUID(), curr_unit_id, curr_tenant_id, 1000.00, 2000.00, '2026-08-01', 'ACTIVE', 'FULL_UNIT');
                
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
    DECLARE charge_cfg_id VARCHAR(36);
    DECLARE password_hash VARCHAR(255);
    
    DECLARE f INT DEFAULT 1;
    DECLARE u INT DEFAULT 1;
    DECLARE unit_num VARCHAR(10);
    DECLARE curr_unit_id VARCHAR(36);
    DECLARE curr_tenant_id VARCHAR(36);
    DECLARE curr_lease_id VARCHAR(36);

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
    INSERT INTO property_tbl (id, name, city, address, total_floors, is_active, allow_partial_payment, auto_bill_day_of_month, auto_bill_time)
    VALUES (prop_id, 'Livic Residency', 'Bangalore', '100 Feet Road, Indiranagar', 5, TRUE, TRUE, 1, '09:00:00');
    
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
            INSERT INTO unit_tbl (id, property_id, unit_number, floor, capacity, type, grid_x, grid_y, grid_width, grid_height)
            VALUES (curr_unit_id, prop_id, unit_num, f, 1, 'SINGLE_UNIT', u, 1, 1, 1);
            
            -- Create Tenant for this unit
            SET curr_tenant_id = UUID();
            INSERT INTO user_tbl (id, auth_uid, full_name, phone_number, password_hash, global_role)
            VALUES (curr_tenant_id, CONCAT('tenant_', unit_num, '@livic.com'), CONCAT('Tenant ', unit_num), CONCAT('9988000', unit_num), password_hash, 'USER');
            
            -- Create Active Lease (Rent: 1000, Security: 2000, Move-in: 2026-05-01)
            SET curr_lease_id = UUID();
            INSERT INTO lease_tbl (id, unit_id, user_id, monthly_rent_amount, security_deposit, move_in_date, status, split_strategy)
            VALUES (curr_lease_id, curr_unit_id, curr_tenant_id, 1000.00, 2000.00, '2026-05-01', 'ACTIVE', 'FULL_UNIT');
            
            -- Month 1: May 2026 (PAID)
            SET cycle_id_may = UUID();
            SET tx_id_may = UUID();
            INSERT INTO payment_transaction_tbl (id, payer_user_id, payment_method, reference_type, reference_id, gateway_name, gateway_transaction_id, amount, status, confirmed_by, confirmed_at, note, created_at, updated_at)
            VALUES (tx_id_may, curr_tenant_id, 'ONLINE_UPI', 'RENT_CYCLE', cycle_id_may, 'RAZORPAY', CONCAT('pay_may_', unit_num, '_', SUBSTRING(UUID(), 1, 8)), 1000.00, 'SUCCESS', owner_id, '2026-05-03 10:30:00', 'Rent Payment May 2026', '2026-05-03 10:30:00', '2026-05-03 10:30:00');
            
            INSERT INTO rent_cycle_tbl (id, lease_id, billing_month, due_date, status, paid_at, created_at, updated_at, total_amount, amount_paid, payment_transaction_id)
            VALUES (cycle_id_may, curr_lease_id, '2026-05', '2026-05-05', 'PAID', '2026-05-03 10:30:00', '2026-05-01 09:00:00', '2026-05-03 10:30:00', 1000.00, 1000.00, tx_id_may);
            
            INSERT INTO rent_cycle_charge_tbl (id, rent_cycle_id, charge_type, amount, description, charge_config_id)
            VALUES (UUID(), cycle_id_may, 'BASE_RENT', 1000.00, 'Monthly Base Rent', charge_cfg_id);

            -- Month 2: June 2026 (PAID)
            SET cycle_id_jun = UUID();
            SET tx_id_jun = UUID();
            INSERT INTO payment_transaction_tbl (id, payer_user_id, payment_method, reference_type, reference_id, gateway_name, gateway_transaction_id, amount, status, confirmed_by, confirmed_at, note, created_at, updated_at)
            VALUES (tx_id_jun, curr_tenant_id, 'ONLINE_UPI', 'RENT_CYCLE', cycle_id_jun, 'RAZORPAY', CONCAT('pay_jun_', unit_num, '_', SUBSTRING(UUID(), 1, 8)), 1000.00, 'SUCCESS', owner_id, '2026-06-04 14:15:00', 'Rent Payment June 2026', '2026-06-04 14:15:00', '2026-06-04 14:15:00');
            
            INSERT INTO rent_cycle_tbl (id, lease_id, billing_month, due_date, status, paid_at, created_at, updated_at, total_amount, amount_paid, payment_transaction_id)
            VALUES (cycle_id_jun, curr_lease_id, '2026-06', '2026-06-05', 'PAID', '2026-06-04 14:15:00', '2026-06-01 09:00:00', '2026-06-04 14:15:00', 1000.00, 1000.00, tx_id_jun);
            
            INSERT INTO rent_cycle_charge_tbl (id, rent_cycle_id, charge_type, amount, description, charge_config_id)
            VALUES (UUID(), cycle_id_jun, 'BASE_RENT', 1000.00, 'Monthly Base Rent', charge_cfg_id);

            -- Month 3: July 2026 (PAID)
            SET cycle_id_jul = UUID();
            SET tx_id_jul = UUID();
            INSERT INTO payment_transaction_tbl (id, payer_user_id, payment_method, reference_type, reference_id, gateway_name, gateway_transaction_id, amount, status, confirmed_by, confirmed_at, note, created_at, updated_at)
            VALUES (tx_id_jul, curr_tenant_id, 'ONLINE_UPI', 'RENT_CYCLE', cycle_id_jul, 'RAZORPAY', CONCAT('pay_jul_', unit_num, '_', SUBSTRING(UUID(), 1, 8)), 1000.00, 'SUCCESS', owner_id, '2026-07-02 09:45:00', 'Rent Payment July 2026', '2026-07-02 09:45:00', '2026-07-02 09:45:00');
            
            INSERT INTO rent_cycle_tbl (id, lease_id, billing_month, due_date, status, paid_at, created_at, updated_at, total_amount, amount_paid, payment_transaction_id)
            VALUES (cycle_id_jul, curr_lease_id, '2026-07', '2026-07-05', 'PAID', '2026-07-02 09:45:00', '2026-07-01 09:00:00', '2026-07-02 09:45:00', 1000.00, 1000.00, tx_id_jul);
            
            INSERT INTO rent_cycle_charge_tbl (id, rent_cycle_id, charge_type, amount, description, charge_config_id)
            VALUES (UUID(), cycle_id_jul, 'BASE_RENT', 1000.00, 'Monthly Base Rent', charge_cfg_id);

            -- Month 4: August 2026 (PAID)
            SET cycle_id_aug = UUID();
            SET tx_id_aug = UUID();
            INSERT INTO payment_transaction_tbl (id, payer_user_id, payment_method, reference_type, reference_id, gateway_name, gateway_transaction_id, amount, status, confirmed_by, confirmed_at, note, created_at, updated_at)
            VALUES (tx_id_aug, curr_tenant_id, 'ONLINE_UPI', 'RENT_CYCLE', cycle_id_aug, 'RAZORPAY', CONCAT('pay_aug_', unit_num, '_', SUBSTRING(UUID(), 1, 8)), 1000.00, 'SUCCESS', owner_id, '2026-08-05 16:20:00', 'Rent Payment August 2026', '2026-08-05 16:20:00', '2026-08-05 16:20:00');
            
            INSERT INTO rent_cycle_tbl (id, lease_id, billing_month, due_date, status, paid_at, created_at, updated_at, total_amount, amount_paid, payment_transaction_id)
            VALUES (cycle_id_aug, curr_lease_id, '2026-08', '2026-08-05', 'PAID', '2026-08-05 16:20:00', '2026-08-01 09:00:00', '2026-08-05 16:20:00', 1000.00, 1000.00, tx_id_aug);
            
            INSERT INTO rent_cycle_charge_tbl (id, rent_cycle_id, charge_type, amount, description, charge_config_id)
            VALUES (UUID(), cycle_id_aug, 'BASE_RENT', 1000.00, 'Monthly Base Rent', charge_cfg_id);

            -- Current Month: September 2026 (PUBLISHED, Due Soon)
            SET cycle_id_sep = UUID();
            INSERT INTO rent_cycle_tbl (id, lease_id, billing_month, due_date, status, paid_at, created_at, updated_at, total_amount, amount_paid, payment_transaction_id)
            VALUES (cycle_id_sep, curr_lease_id, '2026-09', '2026-09-10', 'PUBLISHED', NULL, '2026-09-01 09:00:00', '2026-09-01 09:00:00', 1000.00, 0.00, NULL);
            
            INSERT INTO rent_cycle_charge_tbl (id, rent_cycle_id, charge_type, amount, description, charge_config_id)
            VALUES (UUID(), cycle_id_sep, 'BASE_RENT', 1000.00, 'Monthly Base Rent', charge_cfg_id);
            
            SET u = u + 1;
        END WHILE;
        SET f = f + 1;
    END WHILE;
END //

DELIMITER ;

CALL seed_livic_residency_data();
DROP PROCEDURE seed_livic_residency_data;
