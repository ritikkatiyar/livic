package com.livic.features.marketplace.domain;

import com.livic.platform.common.domain.BaseEntity;
import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.domain.LeadType;
import com.livic.services.finance.domain.UnitBookingTbl;
import com.livic.platform.payment.domain.PaymentTransactionTbl;
import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.domain.UnitTbl;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "marketplace_lead_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceLeadTbl extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private PropertyTbl property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private UnitTbl unit;

    @Enumerated(EnumType.STRING)
    @Column(name = "lead_type", nullable = false, length = 32)
    private LeadType leadType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    @Builder.Default
    private LeadStatus status = LeadStatus.NEW;

    @Column(name = "prospect_name", nullable = false)
    private String prospectName;

    @Column(name = "prospect_phone", nullable = false, length = 20)
    private String prospectPhone;

    @Column(name = "prospect_email")
    private String prospectEmail;

    @Column(name = "preferred_slot")
    private Instant preferredSlot;

    @Column(name = "expected_move_in_date")
    private LocalDate expectedMoveInDate;

    @Column(name = "token_amount", precision = 12, scale = 2)
    private BigDecimal tokenAmount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_transaction_id")
    private PaymentTransactionTbl paymentTransaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "converted_unit_booking_id")
    private UnitBookingTbl convertedUnitBooking;

    @Column(name = "source", length = 32)
    @Builder.Default
    private String source = "MARKETPLACE";
}
