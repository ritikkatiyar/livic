package com.livic.features.marketplace;

import com.livic.platform.common.domain.FacingDirection;
import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.domain.LeadType;
import com.livic.platform.common.domain.UnitType;
import com.livic.platform.common.exception.BusinessException;
import com.livic.features.marketplace.domain.OtpVerificationTbl;
import com.livic.features.marketplace.dto.MarketplaceLeadDTOs;
import com.livic.features.marketplace.repository.OtpVerificationRepository;
import com.livic.features.marketplace.service.interfaces.MarketplaceLeadService;
import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.domain.PropertyType;
import com.livic.services.property.domain.UnitTbl;
import com.livic.services.property.repository.PropertyRepository;
import com.livic.services.property.repository.UnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class MarketplaceLeadServiceIntegrationTest {

    @Autowired
    private MarketplaceLeadService leadService;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private OtpVerificationRepository otpRepository;

    private PropertyTbl property;
    private UnitTbl bookableUnit;
    private UnitTbl unbookableUnit;
    private String validSessionToken;
    private final String prospectPhone = "9876543210";

    @BeforeEach
    public void setUp() {
        property = PropertyTbl.builder()
                .name("Green Park Residency")
                .address("500 Green Avenue")
                .city("Hyderabad")
                .totalFloors(4)
                .propertyType(PropertyType.RENTAL)
                .isActive(true)
                .isPubliclyListed(true)
                .build();
        property = propertyRepository.save(property);

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
        bookableUnit = unitRepository.save(bookableUnit);

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
                .isBookable(false) // Not bookable
                .build();
        unbookableUnit = unitRepository.save(unbookableUnit);

        // Setup verified session token in DB
        validSessionToken = "livic_otp_session_valid_test_token";
        OtpVerificationTbl otpRecord = OtpVerificationTbl.builder()
                .phone(prospectPhone)
                .otpCodeHash("$2a$10$dummyHash")
                .sessionToken(validSessionToken)
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                .verifiedAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .build();
        otpRepository.save(otpRecord);
    }

    @Test
    @DisplayName("Create Lead - Fails when OTP session token is invalid or missing")
    public void testCreateLeadInvalidToken() {
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

        assertThrows(BusinessException.class, () -> 
                leadService.createLead(property.getId(), bookableUnit.getId(), request, "invalid_token"));
    }

    @Test
    @DisplayName("Create Lead - Fails when trying to instant-book an unbookable unit")
    public void testCreateLeadUnbookableUnit() {
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
                leadService.createLead(property.getId(), unbookableUnit.getId(), request, validSessionToken));
        assertTrue(ex.getMessage().contains("not available for instant booking"));
    }

    @Test
    @DisplayName("Create Booking Lead - Succeeds and sets default token amount")
    public void testCreateBookingLeadSuccess() {
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

        MarketplaceLeadDTOs.LeadResponse response = leadService.createLead(property.getId(), bookableUnit.getId(), request, validSessionToken);

        assertNotNull(response.id());
        assertEquals(LeadType.BOOKING, response.leadType());
        assertEquals(LeadStatus.NEW, response.status());
        assertEquals("Jane Doe", response.prospectName());
        assertEquals(new BigDecimal("2000.00"), response.tokenAmount());
    }

    @Test
    @DisplayName("Initiate Token Payment - Creates online payment order for BOOKING lead")
    public void testInitiateTokenPayment() {
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
        MarketplaceLeadDTOs.LeadResponse lead = leadService.createLead(property.getId(), bookableUnit.getId(), request, validSessionToken);

        MarketplaceLeadDTOs.TokenPaymentInitResponse paymentInit = leadService.initiateTokenPayment(lead.id());

        assertNotNull(paymentInit);
        assertEquals(lead.id(), paymentInit.leadId());
        assertNotNull(paymentInit.transactionId());
        assertEquals(new BigDecimal("2000.00"), paymentInit.amount());
        assertEquals("INR", paymentInit.currency());
    }
}
