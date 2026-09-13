package com.livic.services.property;

import com.livic.platform.auth.repository.MembershipRepository;
import com.livic.platform.auth.service.interfaces.MembershipService;
import com.livic.services.billing.SubscriptionTestSupport;
import com.livic.services.billing.repository.SaasSubscriptionRepository;
import com.livic.services.billing.repository.SubscriptionPlanRepository;
import com.livic.platform.common.domain.UserRole;
import com.livic.platform.common.enums.AccessType;
import com.livic.platform.common.exception.BusinessException;
import com.livic.services.property.domain.PropertyJoinCodeTbl;
import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.dto.PropertyJoinCodeDTOs;
import com.livic.services.property.repository.PropertyJoinCodeRepository;
import com.livic.services.property.repository.PropertyRepository;
import com.livic.services.property.service.interfaces.PropertyJoinCodeService;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class PropertyJoinCodeServiceIntegrationTest {

    @Autowired
    private PropertyJoinCodeService propertyJoinCodeService;

    @Autowired
    private PropertyJoinCodeRepository propertyJoinCodeRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private MembershipRepository membershipRepository;

    @Autowired
    private MembershipService membershipService;

    @Autowired
    private SaasSubscriptionRepository subscriptionRepository;

    @Autowired
    private SubscriptionPlanRepository planRepository;

    @Autowired
    private UserRepository userRepository;

    private UserTbl landlord;
    private UserTbl manager;
    private UserTbl newStaff;
    private PropertyTbl property;

    @BeforeEach
    public void setUp() {
        landlord = UserTbl.builder()
                .authUid("landlord-" + UUID.randomUUID() + "@test.com")
                .fullName("Landlord User")
                .phoneNumber("+919000000001")
                .failedLoginAttempts(0)
                .globalRole(UserRole.USER)
                .build();
        landlord = userRepository.save(landlord);

        manager = UserTbl.builder()
                .authUid("manager-" + UUID.randomUUID() + "@test.com")
                .fullName("Manager User")
                .phoneNumber("+919000000002")
                .failedLoginAttempts(0)
                .globalRole(UserRole.USER)
                .build();
        manager = userRepository.save(manager);

        newStaff = UserTbl.builder()
                .authUid("caretaker-" + UUID.randomUUID() + "@test.com")
                .fullName("Caretaker User")
                .phoneNumber("+919000000003")
                .failedLoginAttempts(0)
                .globalRole(UserRole.USER)
                .build();
        newStaff = userRepository.save(newStaff);

        property = PropertyTbl.builder()
                .name("Standard Green Mansion")
                .address("Sector 15")
                .city("Faridabad")
                .build();
        property = propertyRepository.save(property);

        SubscriptionTestSupport.subscribe(subscriptionRepository, planRepository, landlord.getId(), SubscriptionTestSupport.ENTERPRISE_PLAN_ID);

        // Assign landlord as property owner
        membershipService.createOwnerMembership(property.getId(), landlord.getId());

        // Assign manager as custom access
        membershipService.createMembership(
                property.getId(),
                manager.getId(),
                "Property Manager",
                AccessType.CUSTOM_ACCESS,
                Set.of("PROPERTY_VIEW", "LEASE_VIEW"),
                landlord.getId()
        );
    }

    @Test
    public void testLandlordCanGenerateJoinCodeAndStaffCanApply() {
        // Act - Landlord generates caretaker join code
        PropertyJoinCodeDTOs.JoinCodeResponse joinCode = propertyJoinCodeService.generateJoinCode(
                property.getId(),
                "Caretaker",
                AccessType.CUSTOM_ACCESS,
                Set.of("PROPERTY_VIEW"),
                1,
                landlord.getId()
        );

        assertNotNull(joinCode);
        assertNotNull(joinCode.code());
        assertTrue(joinCode.isActive());
        assertEquals("Caretaker", joinCode.title());
        assertEquals(AccessType.CUSTOM_ACCESS, joinCode.accessType());

        // Act - New caretaker applies join code
        PropertyJoinCodeDTOs.JoinCodeResultResponse result = propertyJoinCodeService.validateAndApplyJoinCode(
                joinCode.code(),
                newStaff.getId()
        );

        // Assert - Membership created successfully
        assertNotNull(result);
        assertEquals(property.getId(), result.propertyId());
        assertEquals("Caretaker", result.title());
        assertEquals(AccessType.CUSTOM_ACCESS, result.accessType());
        assertNotNull(result.membershipId());

        // Assert - Join code usage tracked
        PropertyJoinCodeTbl updatedCode = propertyJoinCodeRepository.findById(joinCode.id()).orElseThrow();
        assertEquals(1, updatedCode.getUsesCount());
        assertFalse(updatedCode.isActive(), "Single use code should be deactivated after use");
    }

    @Test
    public void testManagerCannotDelegateFullAccessRole() {
        // Act & Assert - Manager (Custom Access) tries to assign Full Access membership, should fail
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            membershipService.createMembership(
                    property.getId(),
                    newStaff.getId(),
                    "Co-Owner",
                    AccessType.FULL_ACCESS,
                    null,
                    manager.getId()
            );
        });

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertTrue(exception.getMessage().contains("Only members with Full Access can grant Full Access"));
    }
}
