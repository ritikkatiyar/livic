package com.livic.features.marketplace;

import com.livic.platform.common.domain.FacingDirection;
import com.livic.platform.common.domain.UnitType;
import com.livic.platform.common.exception.BusinessException;
import com.livic.features.marketplace.dto.MarketplacePropertyDTOs;
import com.livic.features.marketplace.dto.MarketplaceUnitDTOs;
import com.livic.features.marketplace.service.interfaces.MarketplaceSearchService;
import com.livic.services.property.domain.PropertyTbl;
import com.livic.platform.common.domain.PropertyType;
import com.livic.services.property.domain.UnitTbl;
import com.livic.services.property.repository.PropertyRepository;
import com.livic.services.property.repository.UnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class MarketplaceSearchServiceIntegrationTest {

    @Autowired
    private MarketplaceSearchService searchService;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UnitRepository unitRepository;

    private PropertyTbl publicProperty;
    private PropertyTbl privateProperty;
    private UnitTbl unit1;

    @BeforeEach
    public void setUp() {
        publicProperty = PropertyTbl.builder()
                .name("Grand Luxury Residency")
                .address("100 Tech Park Way")
                .city("Bengaluru")
                .landmark("Near Metro Station")
                .totalFloors(10)
                .propertyType(PropertyType.RENTAL)
                .isActive(true)
                .isPubliclyListed(true)
                .description("Modern co-living space with high-speed WiFi")
                .amenities(new ArrayList<>(List.of("WiFi", "AC", "Gym", "Power Backup")))
                .build();
        publicProperty = propertyRepository.save(publicProperty);

        privateProperty = PropertyTbl.builder()
                .name("Private Villa")
                .address("200 Private Road")
                .city("Bengaluru")
                .totalFloors(2)
                .propertyType(PropertyType.RENTAL)
                .isActive(true)
                .isPubliclyListed(false) // Not publicly listed!
                .build();
        privateProperty = propertyRepository.save(privateProperty);

        unit1 = UnitTbl.builder()
                .property(publicProperty)
                .unitNumber("101-A")
                .floor(1)
                .capacity(1)
                .gridX(0)
                .gridY(0)
                .type(UnitType.STUDIO)
                .facing(FacingDirection.EAST)
                .basePrice(new BigDecimal("15000.00"))
                .isBookable(true)
                .description("Fully furnished luxury studio")
                .amenities("[\"TV\", \"Balcony\"]")
                .build();
        unit1 = unitRepository.save(unit1);
    }

    @Test
    @DisplayName("Search Properties - Returns only publicly listed & active properties")
    public void testSearchPropertiesPublicOnly() {
        Page<MarketplacePropertyDTOs.PropertySummaryResponse> page = searchService.searchProperties("Bengaluru", PropertyType.RENTAL, PageRequest.of(0, 10));

        assertFalse(page.isEmpty());
        assertTrue(page.getContent().stream().anyMatch(p -> p.id().equals(publicProperty.getId())));
        assertFalse(page.getContent().stream().anyMatch(p -> p.id().equals(privateProperty.getId())));
    }

    @Test
    @DisplayName("Get Property Detail - Returns detail for public property & throws for private property")
    public void testGetPropertyDetail() {
        MarketplacePropertyDTOs.PropertyDetailResponse detail = searchService.getPropertyDetail(publicProperty.getId());

        assertNotNull(detail);
        assertEquals("Grand Luxury Residency", detail.name());
        assertEquals(4, detail.amenities().size());
        assertTrue(detail.amenities().contains("WiFi"));
        assertEquals(1, detail.totalUnitsCount());
        assertEquals(1, detail.availableUnitsCount());
        assertEquals("₹15,000/mo", detail.startingPrice());

        // Private property should throw Not Found exception
        assertThrows(BusinessException.class, () -> searchService.getPropertyDetail(privateProperty.getId()));
    }

    @Test
    @DisplayName("Get Property Units - Pages bookable units first, in numeric unit order, and filters by availability")
    public void testGetPropertyUnitsPagination() {
        // unit1 ("101-A", floor 1) is bookable; add 11 occupied units on floor 2, including "210" to check numeric ordering
        for (int i = 1; i <= 11; i++) {
            unitRepository.save(UnitTbl.builder()
                    .property(publicProperty)
                    .unitNumber(String.valueOf(200 + i))
                    .floor(2)
                    .capacity(1)
                    .gridX(i)
                    .gridY(1)
                    .type(UnitType.STUDIO)
                    .facing(FacingDirection.NORTH)
                    .basePrice(new BigDecimal("12000.00"))
                    .isBookable(false)
                    .build());
        }

        Page<MarketplaceUnitDTOs.UnitSummaryResponse> firstPage =
                searchService.getPropertyUnits(publicProperty.getId(), false, PageRequest.of(0, 10));
        assertEquals(12, firstPage.getTotalElements());
        assertEquals(2, firstPage.getTotalPages());
        assertEquals(10, firstPage.getContent().size());
        assertEquals("101-A", firstPage.getContent().get(0).unitNumber());
        assertTrue(firstPage.getContent().get(0).isBookable());
        assertEquals("201", firstPage.getContent().get(1).unitNumber());

        Page<MarketplaceUnitDTOs.UnitSummaryResponse> secondPage =
                searchService.getPropertyUnits(publicProperty.getId(), false, PageRequest.of(1, 10));
        assertEquals(List.of("210", "211"),
                secondPage.getContent().stream().map(MarketplaceUnitDTOs.UnitSummaryResponse::unitNumber).toList());

        Page<MarketplaceUnitDTOs.UnitSummaryResponse> availableOnly =
                searchService.getPropertyUnits(publicProperty.getId(), true, PageRequest.of(0, 10));
        assertEquals(1, availableOnly.getTotalElements());
        assertEquals(unit1.getId(), availableOnly.getContent().get(0).id());

        assertThrows(BusinessException.class,
                () -> searchService.getPropertyUnits(privateProperty.getId(), false, PageRequest.of(0, 10)));
    }

    @Test
    @DisplayName("Get Unit Detail Composite - Returns composite property and unit summary")
    public void testGetUnitDetailComposite() {
        MarketplaceUnitDTOs.UnitDetailCompositeResponse composite = searchService.getUnitDetailComposite(publicProperty.getId(), unit1.getId());

        assertNotNull(composite);
        assertNotNull(composite.property());
        assertNotNull(composite.unit());

        assertEquals(publicProperty.getId(), composite.property().id());
        assertEquals(unit1.getId(), composite.unit().id());
        assertEquals("101-A", composite.unit().unitNumber());
        assertEquals(new BigDecimal("15000.00"), composite.unit().basePrice());
        assertTrue(composite.unit().isBookable());
    }

    @Test
    @DisplayName("Get Property QR Code - Generates valid PNG byte stream and updates qrSlug")
    public void testGetPropertyQrCode() {
        byte[] qrBytes = searchService.getPropertyQrCode(publicProperty.getId());

        assertNotNull(qrBytes);
        assertTrue(qrBytes.length > 0);

        PropertyTbl updatedProperty = propertyRepository.findById(publicProperty.getId()).orElseThrow();
        assertNotNull(updatedProperty.getQrSlug());
        assertTrue(updatedProperty.getQrSlug().startsWith("qr_"));
    }
}
