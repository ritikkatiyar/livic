DELETE FROM flyway_schema_history WHERE version='23';

-- Revert 3
ALTER TABLE billing_worksheet_entry_tbl DROP COLUMN billing_period;
ALTER TABLE billing_worksheet_entry_tbl 
    DROP COLUMN entered_value,
    ADD COLUMN previous_reading DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN current_reading DECIMAL(10, 2);
RENAME TABLE billing_worksheet_entry_tbl TO meter_reading_tbl;

-- Revert 2.1
ALTER TABLE property_tbl 
    DROP COLUMN auto_bill_day_of_month,
    DROP COLUMN auto_bill_time;

-- Revert 2
ALTER TABLE charge_config_tbl DROP COLUMN auto_carry_forward;

-- Revert 1
DROP TABLE IF EXISTS finance_ledger_tbl;
