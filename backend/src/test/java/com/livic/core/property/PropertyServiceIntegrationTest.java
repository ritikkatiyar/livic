package com.livic.core.property;

import com.livic.platform.common.event.PropertyDeletionEvent;
import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.common.domain.UserRole;
import com.livic.platform.common.domain.LeaseStatus;
import com.livic.platform.common.domain.UnitType;
import com.livic.platform.common.domain.FacingDirection;
import com.livic.platform.common.domain.LeaseSplitStrategy;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.domain.UnitTbl;
import com.livic.core.property.dto.UnitDTOs;
import com.livic.core.property.service.impl.UnitLayoutOrchestrationService;
import com.livic.core.property.repository.PropertyRepository;
import com.livic.core.property.repository.UnitRepository;
import com.livic.core.property.service.interfaces.PropertyService;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.repository.UserRepository;
import com.livic.core.finance.domain.LeaseTbl;
import com.livic.core.finance.repository.LeaseRepository;
import com.livic.platform.auth.repository.MembershipRepository;
import com.livic.platform.auth.service.interfaces.MembershipService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class PropertyServiceIntegrationTest {

    @Autowired
    private PropertyService propertyService;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private com.livic.core.property.service.interfaces.BlockService blockService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LeaseRepository leaseRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private MembershipService membershipService;

    @Autowired
    private TestEventListener testEventListener;

    @Autowired
    private UnitLayoutOrchestrationService unitLayoutOrchestrationService;

    private UserTbl landlord;
    private UserTbl tenant;
    private PropertyTbl property;
    private UnitTbl unit;

    @TestConfiguration
    static class TestConfig {
        @Bean
        public TestEventListener testEventListener() {
            return new TestEventListener();
        }
    }

    static class TestEventListener {
        private final List<PropertyDeletionEvent> events = new ArrayList<>();

        @EventListener
        public void handlePropertyDeletion(PropertyDeletionEvent event) {
            events.add(event);
        }

        public void clear() {
            events.clear();
        }

        public List<PropertyDeletionEvent> getEvents() {
            return events;
        }
    }

    @BeforeEach
    public void setUp() {
        testEventListener.clear();

        landlord = UserTbl.builder()
                .authUid("landlord-" + UUID.randomUUID() + "@test.com")
                .fullName("Landlord User")
                .phoneNumber("+91" + (9000000000L + (long)(Math.random() * 999999999)))
                .failedLoginAttempts(0)
                .globalRole(UserRole.SUPER_ADMIN)
                .build();
        landlord = userRepository.save(landlord);

        tenant = UserTbl.builder()
                .authUid("tenant-" + UUID.randomUUID() + "@test.com")
                .fullName("Tenant User")
                .phoneNumber("+91" + (9000000000L + (long)(Math.random() * 999999999)))
                .failedLoginAttempts(0)
                .globalRole(UserRole.USER)
                .build();
        tenant = userRepository.save(tenant);

        property = PropertyTbl.builder()
                .name("Test Property")
                .address("123 Test St")
                .city("Test City")
                .landmark("Test Landmark")
                .totalFloors(5)
                .build();
        property = propertyRepository.save(property);

        unit = UnitTbl.builder()
                .property(property)
                .block(blockService.getOrCreateDefaultBlock(property))
                .unitNumber("101")
                .floor(1)
                .capacity(2)
                .gridX(1)
                .gridY(1)
                .type(UnitType.STUDIO)
                .facing(FacingDirection.NORTH)
                .build();
        unit = unitRepository.save(unit);
    }

    @Test
    public void testDeletePropertyBlockedWhenLeaseExists() {
        // Arrange - Create a lease on the property's unit
        LeaseTbl lease = LeaseTbl.builder()
                .userId(tenant.getId())
                .unitId(unit.getId())
                .status(LeaseStatus.ACTIVE)
                .monthlyRentAmount(BigDecimal.valueOf(1000.00))
                .moveInDate(LocalDate.now().minusDays(10))
                .securityDeposit(BigDecimal.valueOf(30000))
                .splitStrategy(LeaseSplitStrategy.FULL_UNIT)
                .build();
        leaseRepository.save(lease);

        // Act & Assert - Deletion is blocked with BAD_REQUEST
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            propertyService.deleteProperty(property.getId());
        });

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals("Cannot delete property because it has assigned tenants or leases.", exception.getMessage());

        // Assert no event was published
        assertTrue(testEventListener.getEvents().isEmpty(), "No PropertyDeletionEvent should be published when validation fails");

        // Assert property still exists in repository
        assertTrue(propertyRepository.existsById(property.getId()), "Property should not be deleted from DB");
    }

    @Test
    public void testDeletePropertySucceedsWhenNoLeaseExists() {
        // Arrange - Setup a membership for the property
        membershipService.createOwnerMembership(property.getId(), landlord.getId());
        
        // Assert membership exists initially
        assertFalse(membershipRepository.findByPropertyId(property.getId()).isEmpty(), "Membership should be created");

        // Act - Deletion of the property
        propertyService.deleteProperty(property.getId());

        // Assert: Event was published
        assertEquals(1, testEventListener.getEvents().size(), "One PropertyDeletionEvent should be published");
        assertEquals(property.getId(), testEventListener.getEvents().get(0).getPropertyId());

        // Assert: Property is deleted
        assertFalse(propertyRepository.existsById(property.getId()), "Property should be deleted from DB");

        // Assert: Associated unit is deleted
        assertFalse(unitRepository.existsById(unit.getId()), "Property units should be deleted from DB");

        // Assert: Memberships are cleaned up by the event listener (genuine side-effect)
        assertTrue(membershipRepository.findByPropertyId(property.getId()).isEmpty(), "Memberships should be deleted");
    }

    @Test
    public void testFloorLayoutCannotRemoveLeasedUnit() {
        leaseRepository.save(activeLease());

        BusinessException exception = assertThrows(BusinessException.class,
                () -> unitLayoutOrchestrationService.saveFloorLayout(property.getId(), 1, List.of()));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertTrue(unitRepository.existsById(unit.getId()), "Leased unit should not be removed");
    }

    @Test
    public void testFloorLayoutShowsActiveTenantOnUnit() {
        LeaseTbl lease = leaseRepository.save(activeLease());

        List<UnitDTOs.UnitResponse> layout = unitLayoutOrchestrationService.getFloorLayout(property.getId(), 1);

        UnitDTOs.UnitResponse leasedUnit = layout.stream()
                .filter(u -> u.id().equals(unit.getId()))
                .findFirst()
                .orElseThrow();
        assertEquals(1, leasedUnit.activeLeases().size());
        assertEquals(lease.getId(), leasedUnit.activeLeases().get(0).leaseId());
        assertEquals("Tenant User", leasedUnit.activeLeases().get(0).tenantName());
    }

    private LeaseTbl activeLease() {
        return LeaseTbl.builder()
                .userId(tenant.getId())
                .unitId(unit.getId())
                .status(LeaseStatus.ACTIVE)
                .monthlyRentAmount(BigDecimal.valueOf(1000.00))
                .moveInDate(LocalDate.now().minusDays(10))
                .securityDeposit(BigDecimal.valueOf(30000))
                .splitStrategy(LeaseSplitStrategy.FULL_UNIT)
                .build();
    }
}
