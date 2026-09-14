package com.livic.features.marketplace;

import com.livic.platform.common.domain.FacingDirection;
import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.domain.LeadType;
import com.livic.platform.common.domain.UnitType;
import com.livic.services.finance.domain.UnitBookingTbl;
import com.livic.services.finance.repository.UnitBookingRepository;
import com.livic.features.marketplace.domain.MarketplaceLeadTbl;
import com.livic.features.marketplace.listener.MarketplacePaymentEventListener;
import com.livic.features.marketplace.repository.MarketplaceLeadRepository;
import com.livic.platform.payment.event.PaymentCompletedEvent;
import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.domain.PropertyType;
import com.livic.services.property.domain.UnitTbl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MarketplacePaymentEventListenerTest {

    @Mock
    private MarketplaceLeadRepository leadRepository;

    @Mock
    private UnitBookingRepository unitBookingRepository;

    @InjectMocks
    private MarketplacePaymentEventListener eventListener;

    private UUID leadId;
    private UUID unitId;
    private MarketplaceLeadTbl bookingLead;

    @BeforeEach
    public void setUp() {
        leadId = UUID.randomUUID();
        unitId = UUID.randomUUID();

        PropertyTbl property = PropertyTbl.builder()
                .name("Sunrise Apartments")
                .address("123 Sunrise Way")
                .city("Pune")
                .totalFloors(3)
                .propertyType(PropertyType.RENTAL)
                .isActive(true)
                .isPubliclyListed(true)
                .build();

        UnitTbl unit = UnitTbl.builder()
                .property(property)
                .unitNumber("301")
                .floor(3)
                .capacity(2)
                .gridX(0)
                .gridY(0)
                .type(UnitType.STUDIO)
                .facing(FacingDirection.WEST)
                .basePrice(new BigDecimal("22000.00"))
                .isBookable(true)
                .build();
        unit.setId(unitId);

        bookingLead = MarketplaceLeadTbl.builder()
                .property(property)
                .unit(unit)
                .leadType(LeadType.BOOKING)
                .status(LeadStatus.NEW)
                .prospectName("Alice Smith")
                .prospectPhone("9988776655")
                .prospectEmail("alice@example.com")
                .expectedMoveInDate(LocalDate.now().plusDays(10))
                .tokenAmount(new BigDecimal("2000.00"))
                .build();
        bookingLead.setId(leadId);
    }

    @Test
    @DisplayName("PaymentCompletedEvent - Converts Lead & creates unit_booking_tbl entry")
    public void testOnPaymentCompletedSuccess() {
        UUID txId = UUID.randomUUID();
        PaymentCompletedEvent event = PaymentCompletedEvent.builder()
                .transactionId(txId)
                .referenceType("MARKETPLACE_LEAD")
                .referenceId(leadId)
                .payerUserId(leadId)
                .amount(new BigDecimal("2000.00"))
                .gatewayName("RAZORPAY")
                .gatewayTransactionId("pay_test_99887766")
                .build();

        when(leadRepository.findById(leadId)).thenReturn(Optional.of(bookingLead));
        when(unitBookingRepository.save(any(UnitBookingTbl.class))).thenAnswer(i -> {
            UnitBookingTbl ub = i.getArgument(0);
            ub.setId(UUID.randomUUID());
            return ub;
        });

        eventListener.onPaymentCompleted(event);

        // Verify lead updated to CONVERTED
        assertEquals(LeadStatus.CONVERTED, bookingLead.getStatus());
        assertNotNull(bookingLead.getConvertedUnitBooking());

        // Verify unit_booking_tbl created with correct data
        ArgumentCaptor<UnitBookingTbl> captor = ArgumentCaptor.forClass(UnitBookingTbl.class);
        verify(unitBookingRepository).save(captor.capture());
        UnitBookingTbl booking = captor.getValue();
        assertEquals(unitId, booking.getUnitId());
        assertEquals("Alice Smith", booking.getProspectiveTenantName());
        assertEquals("9988776655", booking.getProspectiveTenantPhone());
        assertEquals(new BigDecimal("2000.00"), booking.getTokenAmount());
        assertEquals("BOOKED", booking.getStatus());
        assertEquals(txId, booking.getPaymentTransactionId());

        verify(leadRepository).save(bookingLead);
    }

    @Test
    @DisplayName("PaymentCompletedEvent - Ignores non-marketplace lead reference types")
    public void testOnPaymentCompletedIgnoreOtherReferenceTypes() {
        PaymentCompletedEvent event = PaymentCompletedEvent.builder()
                .referenceType("RENT_CYCLE")
                .referenceId(leadId)
                .build();

        eventListener.onPaymentCompleted(event);

        verify(leadRepository, never()).findById(any());
        verify(unitBookingRepository, never()).save(any());
    }
}
