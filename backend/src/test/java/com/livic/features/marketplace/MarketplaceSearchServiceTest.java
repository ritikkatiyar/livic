package com.livic.features.marketplace;

import com.livic.platform.common.domain.FacingDirection;
import com.livic.platform.common.domain.PropertyType;
import com.livic.platform.common.domain.UnitType;
import com.livic.platform.common.enums.OwnerModule;
import com.livic.platform.common.exception.BusinessException;
import com.livic.features.marketplace.dto.MarketplacePropertyDTOs;
import com.livic.features.marketplace.dto.MarketplaceUnitDTOs;
import com.livic.features.marketplace.qr.QrCodeService;
import com.livic.features.marketplace.service.impl.MarketplaceSearchServiceImpl;
import com.livic.platform.storage.dto.MediaDTOs;
import com.livic.platform.storage.facade.StorageFacade;
import com.livic.services.property.dto.PublicPropertyListingDTO;
import com.livic.services.property.dto.UnitListingDTO;
import com.livic.services.property.facade.PropertyFacade;
import com.livic.services.property.facade.UnitFacade;
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
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MarketplaceSearchServiceTest {

    @Mock
    private PropertyFacade propertyFacade;

    @Mock
    private UnitFacade unitFacade;

    @Mock
    private StorageFacade storageFacade;

    @Mock
    private QrCodeService qrCodeService;

    @InjectMocks
    private MarketplaceSearchServiceImpl searchService;

    private UUID propId;
    private UUID unitId;
    private PublicPropertyListingDTO publicProperty;
    private UnitListingDTO unit1;

    @BeforeEach
    public void setUp() {
        propId = UUID.randomUUID();
        unitId = UUID.randomUUID();

        publicProperty = new PublicPropertyListingDTO(
                propId, "Grand Luxury Residency", "100 Tech Park Way", "Bengaluru", "Near Metro Station", 10,
                PropertyType.RENTAL, "Modern co-living space", List.of("WiFi", "AC"), null);

        unit1 = new UnitListingDTO(
                unitId, propId, "101-A", 1, 1, UnitType.STUDIO, FacingDirection.EAST,
                new BigDecimal("15000.00"), true, null, List.of());
    }

    private static MediaDTOs.MediaAssetDTO asset(UUID referenceId, String url) {
        return new MediaDTOs.MediaAssetDTO(UUID.randomUUID(), OwnerModule.PROPERTY, referenceId, null, null, url, null, null, null, null);
    }

    @Test
    @DisplayName("Search Properties - Returns summary page with starting price & images")
    public void testSearchPropertiesSuccess() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<PublicPropertyListingDTO> propertyPage = new PageImpl<>(List.of(publicProperty), pageable, 1);

        when(propertyFacade.searchPublicListings("Bengaluru", PropertyType.RENTAL, pageable)).thenReturn(propertyPage);
        when(storageFacade.getAssetsForReferences(OwnerModule.PROPERTY, List.of(propId)))
                .thenReturn(Map.of(propId, List.of(asset(propId, "https://cdn.livic.com/img1.jpg"))));
        when(unitFacade.getUnitListingsByPropertyIds(List.of(propId))).thenReturn(Map.of(propId, List.of(unit1)));

        Page<MarketplacePropertyDTOs.PropertySummaryResponse> result = searchService.searchProperties("Bengaluru", PropertyType.RENTAL, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        MarketplacePropertyDTOs.PropertySummaryResponse summary = result.getContent().get(0);
        assertEquals("Grand Luxury Residency", summary.name());
        assertEquals("₹15,000/mo", summary.startingPrice());
        assertEquals(1, summary.totalUnitsCount());
        assertEquals(1, summary.images().size());
        assertEquals("https://cdn.livic.com/img1.jpg", summary.images().get(0));
    }

    @Test
    @DisplayName("Get Property Detail - Success")
    public void testGetPropertyDetailSuccess() {
        when(propertyFacade.getPublicListing(propId)).thenReturn(Optional.of(publicProperty));
        when(storageFacade.getAssets(OwnerModule.PROPERTY, propId)).thenReturn(Collections.emptyList());
        UnitListingDTO occupiedUnit = new UnitListingDTO(
                UUID.randomUUID(), propId, "102-A", 1, 1, UnitType.STUDIO, FacingDirection.WEST,
                new BigDecimal("12000.00"), false, null, List.of());
        when(unitFacade.getUnitListingsByPropertyId(propId)).thenReturn(List.of(unit1, occupiedUnit));

        MarketplacePropertyDTOs.PropertyDetailResponse detail = searchService.getPropertyDetail(propId);

        assertNotNull(detail);
        assertEquals(propId, detail.id());
        assertEquals("Grand Luxury Residency", detail.name());
        assertEquals(2, detail.amenities().size());
        assertEquals(2, detail.totalUnitsCount());
        assertEquals(1, detail.availableUnitsCount());
        assertEquals("₹12,000/mo", detail.startingPrice());
        // Unit images are no longer loaded for the detail view
        verify(storageFacade, never()).getAssetsForReferences(any(), any());
    }

    @Test
    @DisplayName("Get Property Units - Returns a page with images for that page's units only")
    public void testGetPropertyUnitsPage() {
        Pageable pageable = PageRequest.of(1, 10);
        when(propertyFacade.getPublicListing(propId)).thenReturn(Optional.of(publicProperty));
        when(unitFacade.getUnitListingsByPropertyId(propId, true, pageable))
                .thenReturn(new PageImpl<>(List.of(unit1), pageable, 11));
        when(storageFacade.getAssetsForReferences(OwnerModule.PROPERTY, List.of(unitId)))
                .thenReturn(Map.of(unitId, List.of(asset(unitId, "https://cdn.livic.com/unit.jpg"))));

        Page<MarketplaceUnitDTOs.UnitSummaryResponse> page = searchService.getPropertyUnits(propId, true, pageable);

        assertEquals(11, page.getTotalElements());
        assertEquals(2, page.getTotalPages());
        assertEquals(1, page.getContent().size());
        assertEquals(unitId, page.getContent().get(0).id());
        assertEquals(List.of("https://cdn.livic.com/unit.jpg"), page.getContent().get(0).images());
    }

    @Test
    @DisplayName("Get Property Units - Caps the page size")
    public void testGetPropertyUnitsCapsPageSize() {
        when(propertyFacade.getPublicListing(propId)).thenReturn(Optional.of(publicProperty));
        when(unitFacade.getUnitListingsByPropertyId(eq(propId), eq(false), any(Pageable.class)))
                .thenAnswer(i -> new PageImpl<UnitListingDTO>(List.of(), i.getArgument(2), 0));

        searchService.getPropertyUnits(propId, false, PageRequest.of(0, 500));

        verify(unitFacade).getUnitListingsByPropertyId(propId, false, PageRequest.of(0, 50));
    }

    @Test
    @DisplayName("Get Property Units - Throws 404 when property is unlisted")
    public void testGetPropertyUnitsUnlisted() {
        when(propertyFacade.getPublicListing(propId)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> searchService.getPropertyUnits(propId, false, PageRequest.of(0, 10)));
        verify(unitFacade, never()).getUnitListingsByPropertyId(any(), anyBoolean(), any());
    }

    @Test
    @DisplayName("Get Property Detail - Throws 404 when property is unlisted")
    public void testGetPropertyDetailUnlisted() {
        when(propertyFacade.getPublicListing(propId)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> searchService.getPropertyDetail(propId));
    }

    @Test
    @DisplayName("Get Unit Detail Composite - Success")
    public void testGetUnitDetailCompositeSuccess() {
        when(propertyFacade.getPublicListing(propId)).thenReturn(Optional.of(publicProperty));
        when(unitFacade.getUnitListingById(unitId)).thenReturn(Optional.of(unit1));
        when(unitFacade.getUnitListingsByPropertyId(propId)).thenReturn(List.of(unit1));
        when(storageFacade.getAssets(eq(OwnerModule.PROPERTY), any(UUID.class))).thenReturn(Collections.emptyList());

        MarketplaceUnitDTOs.UnitDetailCompositeResponse composite = searchService.getUnitDetailComposite(propId, unitId);

        assertNotNull(composite);
        assertEquals(propId, composite.property().id());
        assertEquals(unitId, composite.unit().id());
        assertEquals("101-A", composite.unit().unitNumber());
        assertEquals(new BigDecimal("15000.00"), composite.unit().basePrice());
    }

    @Test
    @DisplayName("Get Unit Detail Composite - Throws when unit belongs to another property")
    public void testGetUnitDetailCompositeMismatch() {
        UnitListingDTO foreignUnit = new UnitListingDTO(
                unitId, UUID.randomUUID(), "999", 1, 1, UnitType.STUDIO, FacingDirection.EAST,
                new BigDecimal("15000.00"), true, null, List.of());
        when(propertyFacade.getPublicListing(propId)).thenReturn(Optional.of(publicProperty));
        when(unitFacade.getUnitListingById(unitId)).thenReturn(Optional.of(foreignUnit));

        assertThrows(BusinessException.class, () -> searchService.getUnitDetailComposite(propId, unitId));
    }

    @Test
    @DisplayName("Get Property QR Code - Generates QR byte stream")
    public void testGetPropertyQrCodeSuccess() {
        when(propertyFacade.getOrCreateQrSlug(propId)).thenReturn(Optional.of("qr_existing_slug"));
        byte[] mockBytes = new byte[]{1, 2, 3, 4};
        when(qrCodeService.generateQrCodePng(any(String.class), eq(300), eq(300))).thenReturn(mockBytes);

        byte[] qrCode = searchService.getPropertyQrCode(propId);

        assertNotNull(qrCode);
        assertArrayEquals(mockBytes, qrCode);
    }

    @Test
    @DisplayName("Get Property QR Code - Throws 404 when property does not exist")
    public void testGetPropertyQrCodeNotFound() {
        when(propertyFacade.getOrCreateQrSlug(propId)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class, () -> searchService.getPropertyQrCode(propId));
        verifyNoInteractions(qrCodeService);
    }
}
