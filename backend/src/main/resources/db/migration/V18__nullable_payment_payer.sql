-- Flyway Migration V18: allow payments that have no payer account.
-- Marketplace prospects pay a booking token before they are users, so payer_user_id must be optional.
-- The transaction is still identified by reference_type + reference_id (e.g. MARKETPLACE_LEAD + lead id),
-- and the foreign key still applies whenever a payer is recorded.

ALTER TABLE payment_transaction_tbl
    MODIFY COLUMN payer_user_id VARCHAR(36) DEFAULT NULL;
