-- V13__create_auth_identity_and_email_verification.sql
-- External auth identities (Google today, more providers later) and email OTP verification for self-signup.

-- Existing and landlord-provisioned accounts stay verified; only self-signup starts unverified.
ALTER TABLE `user_tbl`
  ADD COLUMN `email_verified` BOOLEAN NOT NULL DEFAULT TRUE AFTER `password_hash`;

UPDATE `user_tbl` SET `phone_number` = NULL WHERE `phone_number` = '';

CREATE TABLE `auth_identity_tbl` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `provider` VARCHAR(32) NOT NULL,
  `provider_subject` VARCHAR(255) NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_auth_identity_provider_subject` (`provider`, `provider_subject`),
  KEY `idx_auth_identity_user` (`user_id`),
  CONSTRAINT `fk_auth_identity_user` FOREIGN KEY (`user_id`) REFERENCES `user_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `email_verification_tbl` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `code_hash` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME(6) NOT NULL,
  `attempt_count` INT NOT NULL DEFAULT 0,
  `last_sent_at` DATETIME(6) NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email_verification_user` (`user_id`),
  CONSTRAINT `fk_email_verification_user` FOREIGN KEY (`user_id`) REFERENCES `user_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
