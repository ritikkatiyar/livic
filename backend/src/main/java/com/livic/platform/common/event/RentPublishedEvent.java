package com.livic.platform.common.event;

import org.springframework.context.ApplicationEvent;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class RentPublishedEvent extends ApplicationEvent {
    private final UUID billId;
    private final UUID tenantUserId;
    private final String billingMonth;
    private final BigDecimal totalAmount;
    private final LocalDate dueDate;

    public RentPublishedEvent(Object source, UUID billId, UUID tenantUserId, String billingMonth, BigDecimal totalAmount, LocalDate dueDate) {
        super(source);
        this.billId = billId;
        this.tenantUserId = tenantUserId;
        this.billingMonth = billingMonth;
        this.totalAmount = totalAmount;
        this.dueDate = dueDate;
    }

    public UUID getBillId() {
        return billId;
    }

    public UUID getTenantUserId() {
        return tenantUserId;
    }

    public String getBillingMonth() {
        return billingMonth;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }
}
