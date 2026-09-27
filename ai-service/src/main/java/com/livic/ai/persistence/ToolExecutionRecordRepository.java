package com.livic.ai.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ToolExecutionRecordRepository extends JpaRepository<ToolExecutionRecord, UUID> {
}
