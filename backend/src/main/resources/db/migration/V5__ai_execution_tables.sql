-- V5__ai_execution_tables.sql
-- ai-service moves from the prototype job queue to audited agent executions
-- (docs/AI_ARCHITECTURE_DESIGN.md Â§13-14, Â§26). ai_job_tbl stored user JWTs in
-- plaintext and no client used it.

DROP TABLE IF EXISTS `ai_job_tbl`;

CREATE TABLE `ai_execution_tbl` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `agent_id` varchar(64) NOT NULL,
  `status` varchar(32) NOT NULL,
  `steps` int NOT NULL DEFAULT '0',
  `prompt` text NOT NULL,
  `final_response` text,
  `error_message` text,
  `model` varchar(128) DEFAULT NULL,
  `input_tokens` int NOT NULL DEFAULT '0',
  `output_tokens` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_ai_execution_user_created` (`user_id`, `created_at`),
  CONSTRAINT `fk_ai_execution_user` FOREIGN KEY (`user_id`) REFERENCES `user_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `ai_tool_execution_record_tbl` (
  `id` varchar(36) NOT NULL,
  `execution_id` varchar(36) NOT NULL,
  `step_number` int NOT NULL,
  `tool_name` varchar(64) NOT NULL,
  `input_payload` text,
  `output_payload` text,
  `status` varchar(32) NOT NULL,
  `duration_ms` bigint NOT NULL DEFAULT '0',
  `error_message` text,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_ai_tool_record_execution` (`execution_id`),
  CONSTRAINT `fk_ai_tool_record_execution` FOREIGN KEY (`execution_id`) REFERENCES `ai_execution_tbl` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
