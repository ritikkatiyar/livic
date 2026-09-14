package com.livic.features.marketplace;

import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.domain.LeadType;
import com.livic.features.marketplace.domain.MarketplaceLeadTbl;
import com.livic.features.marketplace.listener.MarketplacePaymentEventListener;
import com.livic.features.marketplace.repository.MarketplaceLeadRepository;
import com.livic.platform.payment.event.PaymentCompletedEvent;
import com.livic.services.finance.dto.UnitBookingDTOs;
import com.livic.services.finance.facade.FinanceFacade;
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
    private FinanceFacade financeFacade;

    @InjectMocks
    private MarketplacePaymentEventListener eventListener;

    private UUID leadId;
    private UUID unitId;
    private MarketplaceLeadTbl bookingLead;

    @BeforeEach
    public void setUp() {
        leadId = UUID.randomUUID();
        unitId = UUID.randomUUID();

        bookingLead = MarketplaceLeadTbl.builder()
                .propertyId(UUID.randomUUID())
                .unitId(unitId)
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
    @DisplayName("PaymentCompletedEvent - Converts Lead & creates unit booking through finance facade")
    public void testOnPaymentCompletedSuccess() {
        UUID txId = UUID.randomUUID();
        UUID bookingId = UUID.randomUUID();
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
        when(financeFacade.createPaidBooking(any(UnitBookingDTOs.PaidBookingRequest.class))).thenAnswer(i -> {
            UnitBookingDTOs.PaidBookingRequest req = i.getArgument(0);
            return new UnitBookingDTOs.UnitBookingResponse(
                    bookingId, req.unitId(), "301", null, req.prospectiveTenantName(), req.prospectiveTenantPhone(),
                    req.prospectiveTenantEmail(), req.tokenAmount(), req.expectedMoveInDate(), "BOOKED",
                    req.paymentTransactionId(), null, null, null);
        });

        eventListener.onPaymentCompleted(event);

        // Verify lead updated to CONVERTED
        assertEquals(LeadStatus.CONVERTED, bookingLead.getStatus());
        assertEquals(bookingId, bookingLead.getConvertedUnitBookingId());

        // Verify booking requested with correct data
        ArgumentCaptor<UnitBookingDTOs.PaidBookingRequest> captor = ArgumentCaptor.forClass(UnitBookingDTOs.PaidBookingRequest.class);
        verify(financeFacade).createPaidBooking(captor.capture());
        UnitBookingDTOs.PaidBookingRequest booking = captor.getValue();
        assertEquals(unitId, booking.unitId());
        assertEquals("Alice Smith", booking.prospectiveTenantName());
        assertEquals("9988776655", booking.prospectiveTenantPhone());
        assertEquals(new BigDecimal("2000.00"), booking.tokenAmount());
        assertEquals(txId, booking.paymentTransactionId());

        verify(leadRepository).save(bookingLead);
    }

    @Test
    @DisplayName("PaymentCompletedEvent - Does not create a second booking for an already converted lead")
    public void testOnPaymentCompletedAlreadyConverted() {
        bookingLead.setConvertedUnitBookingId(UUID.randomUUID());
        PaymentCompletedEvent event = PaymentCompletedEvent.builder()
                .transactionId(UUID.randomUUID())
                .referenceType("MARKETPLACE_LEAD")
                .referenceId(leadId)
                .amount(new BigDecimal("2000.00"))
                .build();

        when(leadRepository.findById(leadId)).thenReturn(Optional.of(bookingLead));

        eventListener.onPaymentCompleted(event);

        verify(financeFacade, never()).createPaidBooking(any());
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
        verify(financeFacade, never()).createPaidBooking(any());
    }
}
