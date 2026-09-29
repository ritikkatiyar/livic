-- SMS notifications (MSG91): prospects without user accounts, OTP abuse limits, tour reminders

-- Marketplace prospects are reached by phone and have no user row
ALTER TABLE notification_log_tbl
    MODIFY COLUMN recipient_id VARCHAR(36) NULL,
    ADD COLUMN template VARCHAR(40) NULL AFTER recipient_address;

-- Per-IP cap on OTP requests (SMS cost and abuse)
ALTER TABLE otp_verification_tbl
    ADD COLUMN request_ip VARCHAR(45) NULL,
    ADD INDEX idx_otp_verification_ip_created (request_ip, created_at);

-- Set when the reminder for an approved tour has been handled, so it is sent at most once
ALTER TABLE marketplace_lead_tbl
    ADD COLUMN reminder_sent_at DATETIME(6) NULL;
