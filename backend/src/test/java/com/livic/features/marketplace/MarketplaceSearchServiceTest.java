package com.livic.features.marketplace;

import com.livic.platform.common.domain.FacingDirection;
import com.livic.platform.common.domain.UnitType;
import com.livic.platform.common.enums.OwnerModule;
import com.livic.platform.common.exception.BusinessException;
import com.livic.features.marketplace.dto.MarketplacePropertyDTOs;
import com.livic.features.marketplace.dto.MarketplaceUnitDTOs;
import com.livic.features.marketplace.qr.QrCodeService;
import com.livic.features.marketplace.service.impl.MarketplaceSearchServiceImpl;
import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.domain.PropertyType;
import com.livic.services.property.domain.UnitTbl;
import com.livic.services.property.repository.PropertyRepository;
import com.livic.services.property.repository.UnitRepository;
import com.livic.platform.storage.domain.MediaAssetTbl;
import com.livic.platform.storage.repository.MediaAssetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MarketplaceSearchServiceTest {

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private UnitRepository unitRepository;

    @Mock
    private MediaAssetRepository mediaAssetRepository;

    @Mock
    private QrCodeService qrCodeService;

    @InjectMocks
    private MarketplaceSearchServiceImpl searchService;

    private UUID propId;
    private UUID unitId;
    private PropertyTbl publicProperty;
    private UnitTbl unit1;

    @BeforeEach
    public void setUp() {
        propId = UUID.randomUUID();
        unitId = UUID.randomUUID();

        publicProperty = PropertyTbl.builder()
                .name("Grand Luxury Residency")
                .address("100 Tech Park Way")
                .city("Bengaluru")
                .landmark("Near Metro Station")
                .totalFloors(10)
                .propertyType(PropertyType.RENTAL)
                .isActive(true)
                .isPubliclyListed(true)
                .description("Modern co-living space")
                .amenities(new ArrayList<>(List.of("WiFi", "AC")))
                .build();
        publicProperty.setId(propId);

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
                .build();
        unit1.setId(unitId);
    }

    @Test
    @DisplayName("Search Properties - Returns summary page with starting price & images")
    public void testSearchPropertiesSuccess() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<PropertyTbl> propertyPage = new PageImpl<>(List.of(publicProperty), pageable, 1);

        when(propertyRepository.searchPublicProperties("Bengaluru", PropertyType.RENTAL, pageable)).thenReturn(propertyPage);
        
        MediaAssetTbl asset = MediaAssetTbl.builder()
                .ownerModule(OwnerModule.PROPERTY)
                .referenceId(propId)
                .url("https://cdn.livic.com/img1.jpg")
                .build();
        when(mediaAssetRepository.findAllByOwnerModuleAndReferenceIdIn(OwnerModule.PROPERTY, List.of(propId)))
                .thenReturn(List.of(asset));
        when(unitRepository.findByPropertyId(propId)).thenReturn(List.of(unit1));

        Page<MarketplacePropertyDTOs.PropertySummaryResponse> result = searchService.searchProperties("Bengaluru", PropertyType.RENTAL, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        MarketplacePropertyDTOs.PropertySummaryResponse summary = result.getContent().get(0);
        assertEquals("Grand Luxury Residency", summary.name());
        assertEquals("₹15,000/mo", summary.startingPrice());
        assertEquals(1, summary.images().size());
        assertEquals("https://cdn.livic.com/img1.jpg", summary.images().get(0));
    }

    @Test
    @DisplayName("Get Property Detail - Success")
    public void testGetPropertyDetailSuccess() {
        when(propertyRepository.findById(propId)).thenReturn(Optional.of(publicProperty));
        when(mediaAssetRepository.findAllByOwnerModuleAndReferenceId(OwnerModule.PROPERTY, propId))
                .thenReturn(Collections.emptyList());
        when(unitRepository.findByPropertyId(propId)).thenReturn(List.of(unit1));

        MarketplacePropertyDTOs.PropertyDetailResponse detail = searchService.getPropertyDetail(propId);

        assertNotNull(detail);
        assertEquals(propId, detail.id());
        assertEquals("Grand Luxury Residency", detail.name());
        assertEquals(2, detail.amenities().size());
        assertEquals(1, detail.units().size());
    }

    @Test
    @DisplayName("Get Property Detail - Throws 404 when property is unlisted")
    public void testGetPropertyDetailUnlisted() {
        publicProperty.setPubliclyListed(false);
        when(propertyRepository.findById(propId)).thenReturn(Optional.of(publicProperty));

        assertThrows(BusinessException.class, () -> searchService.getPropertyDetail(propId));
    }

    @Test
    @DisplayName("Get Unit Detail Composite - Success")
    public void testGetUnitDetailCompositeSuccess() {
        when(propertyRepository.findById(propId)).thenReturn(Optional.of(publicProperty));
        when(unitRepository.findById(unitId)).thenReturn(Optional.of(unit1));
        when(unitRepository.findByPropertyId(propId)).thenReturn(List.of(unit1));

        MarketplaceUnitDTOs.UnitDetailCompositeResponse composite = searchService.getUnitDetailComposite(propId, unitId);

        assertNotNull(composite);
        assertEquals(propId, composite.property().id());
        assertEquals(unitId, composite.unit().id());
        assertEquals("101-A", composite.unit().unitNumber());
        assertEquals(new BigDecimal("15000.00"), composite.unit().basePrice());
    }

    @Test
    @DisplayName("Get Property QR Code - Generates QR byte stream")
    public void testGetPropertyQrCodeSuccess() {
        publicProperty.setQrSlug("qr_existing_slug");
        when(propertyRepository.findById(propId)).thenReturn(Optional.of(publicProperty));
        byte[] mockBytes = new byte[]{1, 2, 3, 4};
        when(qrCodeService.generateQrCodePng(any(String.class), eq(300), eq(300))).thenReturn(mockBytes);

        byte[] qrCode = searchService.getPropertyQrCode(propId);

        assertNotNull(qrCode);
        assertArrayEquals(mockBytes, qrCode);
    }
}
