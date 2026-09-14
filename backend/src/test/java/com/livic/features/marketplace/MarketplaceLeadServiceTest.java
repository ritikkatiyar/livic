package com.livic.features.marketplace;

import com.livic.platform.common.domain.FacingDirection;
import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.domain.LeadType;
import com.livic.platform.common.domain.UnitType;
import com.livic.platform.common.exception.BusinessException;
import com.livic.features.marketplace.domain.MarketplaceLeadTbl;
import com.livic.features.marketplace.dto.MarketplaceLeadDTOs;
import com.livic.features.marketplace.repository.MarketplaceLeadRepository;
import com.livic.features.marketplace.service.impl.MarketplaceLeadServiceImpl;
import com.livic.features.marketplace.service.interfaces.OtpService;
import com.livic.platform.payment.domain.PaymentTransactionTbl;
import com.livic.platform.payment.service.interfaces.PaymentTransactionService;
import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.domain.PropertyType;
import com.livic.services.property.domain.UnitTbl;
import com.livic.services.property.repository.PropertyRepository;
import com.livic.services.property.repository.UnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MarketplaceLeadServiceTest {

    @Mock
    private MarketplaceLeadRepository leadRepository;

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private UnitRepository unitRepository;

    @Mock
    private OtpService otpService;

    @Mock
    private PaymentTransactionService paymentTransactionService;

    @InjectMocks
    private MarketplaceLeadServiceImpl leadService;

    private UUID propId;
    private UUID unitId;
    private PropertyTbl property;
    private UnitTbl bookableUnit;
    private UnitTbl unbookableUnit;

    private final String sessionToken = "livic_otp_session_12345";
    private final String prospectPhone = "9876543210";

    @BeforeEach
    public void setUp() {
        propId = UUID.randomUUID();
        unitId = UUID.randomUUID();

        property = PropertyTbl.builder()
                .name("Green Park Residency")
                .address("500 Green Avenue")
                .city("Hyderabad")
                .totalFloors(4)
                .propertyType(PropertyType.RENTAL)
                .isActive(true)
                .isPubliclyListed(true)
                .build();
        property.setId(propId);

        bookableUnit = UnitTbl.builder()
                .property(property)
                .unitNumber("201")
                .floor(2)
                .capacity(2)
                .gridX(0)
                .gridY(0)
                .type(UnitType.STUDIO)
                .facing(FacingDirection.NORTH)
                .basePrice(new BigDecimal("18000.00"))
                .isBookable(true)
                .build();
        bookableUnit.setId(unitId);

        unbookableUnit = UnitTbl.builder()
                .property(property)
                .unitNumber("202")
                .floor(2)
                .capacity(2)
                .gridX(1)
                .gridY(0)
                .type(UnitType.STUDIO)
                .facing(FacingDirection.SOUTH)
                .basePrice(new BigDecimal("18000.00"))
                .isBookable(false)
                .build();
        unbookableUnit.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("Create Lead - Success for bookable unit")
    public void testCreateLeadBookingSuccess() {
        doNothing().when(otpService).validateSessionToken(sessionToken, prospectPhone);
        when(propertyRepository.findById(propId)).thenReturn(Optional.of(property));
        when(unitRepository.findById(unitId)).thenReturn(Optional.of(bookableUnit));
        when(leadRepository.save(any(MarketplaceLeadTbl.class))).thenAnswer(i -> {
            MarketplaceLeadTbl lead = i.getArgument(0);
            lead.setId(UUID.randomUUID());
            return lead;
        });

        MarketplaceLeadDTOs.CreateLeadRequest request = new MarketplaceLeadDTOs.CreateLeadRequest(
                LeadType.BOOKING,
                "Jane Doe",
                prospectPhone,
                "jane@example.com",
                null,
                LocalDate.now().plusDays(5),
                null,
                "MARKETPLACE"
        );

        MarketplaceLeadDTOs.LeadResponse response = leadService.createLead(propId, unitId, request, sessionToken);

        assertNotNull(response);
        assertEquals(LeadType.BOOKING, response.leadType());
        assertEquals(LeadStatus.NEW, response.status());
        assertEquals("Jane Doe", response.prospectName());
        assertEquals(new BigDecimal("2000.00"), response.tokenAmount());
    }

    @Test
    @DisplayName("Create Lead - Fails when unit is unbookable for instant booking")
    public void testCreateLeadUnbookableFailure() {
        UUID unbookableId = unbookableUnit.getId();
        doNothing().when(otpService).validateSessionToken(sessionToken, prospectPhone);
        when(propertyRepository.findById(propId)).thenReturn(Optional.of(property));
        when(unitRepository.findById(unbookableId)).thenReturn(Optional.of(unbookableUnit));

        MarketplaceLeadDTOs.CreateLeadRequest request = new MarketplaceLeadDTOs.CreateLeadRequest(
                LeadType.BOOKING,
                "Jane Doe",
                prospectPhone,
                "jane@example.com",
                null,
                LocalDate.now().plusDays(5),
                null,
                "MARKETPLACE"
        );

        BusinessException ex = assertThrows(BusinessException.class, () ->
                leadService.createLead(propId, unbookableId, request, sessionToken));

        assertTrue(ex.getMessage().contains("not available for instant booking"));
        verify(leadRepository, never()).save(any());
    }

    @Test
    @DisplayName("Initiate Token Payment - Success")
    public void testInitiateTokenPaymentSuccess() {
        UUID leadId = UUID.randomUUID();
        MarketplaceLeadTbl lead = MarketplaceLeadTbl.builder()
                .property(property)
                .unit(bookableUnit)
                .leadType(LeadType.BOOKING)
                .status(LeadStatus.NEW)
                .prospectName("Jane Doe")
                .prospectPhone(prospectPhone)
                .tokenAmount(new BigDecimal("2000.00"))
                .build();
        lead.setId(leadId);

        when(leadRepository.findById(leadId)).thenReturn(Optional.of(lead));

        PaymentTransactionTbl tx = PaymentTransactionTbl.builder()
                .payerUserId(leadId)
                .referenceType("MARKETPLACE_LEAD")
                .referenceId(leadId)
                .amount(new BigDecimal("2000.00"))
                .gatewayTransactionId("order_razorpay_123")
                .build();
        tx.setId(UUID.randomUUID());

        when(paymentTransactionService.initiateOnlinePayment(eq(leadId), eq("MARKETPLACE_LEAD"), eq(leadId), eq(new BigDecimal("2000.00"))))
                .thenReturn(tx);

        MarketplaceLeadDTOs.TokenPaymentInitResponse response = leadService.initiateTokenPayment(leadId);

        assertNotNull(response);
        assertEquals(leadId, response.leadId());
        assertEquals(tx.getId(), response.transactionId());
        assertEquals("order_razorpay_123", response.razorpayOrderId());
        assertEquals(new BigDecimal("2000.00"), response.amount());
        assertEquals("INR", response.currency());
    }
}
