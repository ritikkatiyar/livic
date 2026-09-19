package com.livic.verticals.rental.inventory.domain;

import com.livic.verticals.rental.inventory.domain.enums.InventoryCategory;
import com.livic.verticals.rental.inventory.domain.enums.InventoryCondition;
import com.livic.verticals.rental.inventory.domain.enums.InventoryScope;
import com.livic.verticals.rental.inventory.domain.enums.InventoryStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "inventory_item_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItemTbl {

    @Id
    @Column(name = "id", nullable = false, length = 36)
    private UUID id;

    @Column(name = "property_id", nullable = false, length = 36)
    private UUID propertyId;

    @Column(name = "unit_id", length = 36)
    private UUID unitId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 64)
    private InventoryCategory category;

    @Column(name = "serial_number", length = 128)
    private String serialNumber;

    @Column(name = "model_number", length = 128)
    private String modelNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope", nullable = false, length = 32)
    private InventoryScope scope;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_condition", nullable = false, length = 32)
    private InventoryCondition currentCondition;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private InventoryStatus status;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "warranty_expires_at")
    private LocalDate warrantyExpiresAt;

    @Column(name = "next_service_date")
    private LocalDate nextServiceDate;

    @Column(name = "replacement_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal replacementValue;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
