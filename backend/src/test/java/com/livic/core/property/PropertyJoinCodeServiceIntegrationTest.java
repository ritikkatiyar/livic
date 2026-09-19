package com.livic.core.property;

import com.livic.platform.auth.facade.AuthFacade;
import com.livic.platform.auth.repository.MembershipRepository;
import com.livic.platform.auth.service.interfaces.AuthorizationService;
import com.livic.platform.common.constant.StaffPermission;
import com.livic.platform.security.UserDetailsImpl;
import com.livic.core.finance.dto.MeDTOs;
import com.livic.core.finance.service.interfaces.MeService;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import com.livic.platform.auth.service.interfaces.MembershipService;
import com.livic.platform.subscription.SubscriptionTestSupport;
import com.livic.platform.subscription.repository.SaasSubscriptionRepository;
import com.livic.platform.subscription.repository.SubscriptionPlanRepository;
import com.livic.platform.common.domain.UserRole;
import com.livic.platform.common.enums.AccessType;
import com.livic.platform.common.exception.BusinessException;
import com.livic.core.property.domain.PropertyJoinCodeTbl;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.dto.PropertyJoinCodeDTOs;
import com.livic.core.property.repository.PropertyJoinCodeRepository;
import com.livic.core.property.repository.PropertyRepository;
import com.livic.core.property.service.interfaces.PropertyJoinCodeService;
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

    @Autowired
    private AuthFacade authFacade;

    @Autowired
    private AuthorizationService authorizationService;

    @Autowired
    private MeService meService;

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
    public void customJoinCodeGrantsOnlySelectedFeatures() {
        Set<String> caretakerCodes = Set.of("METER_READING_VIEW", "METER_READING_CREATE", "ISSUE_VIEW");

        PropertyJoinCodeDTOs.JoinCodeResponse joinCode = propertyJoinCodeService.generateJoinCode(
                property.getId(), "Caretaker", AccessType.CUSTOM_ACCESS, caretakerCodes, 1, landlord.getId());
        PropertyJoinCodeDTOs.JoinCodeResultResponse result =
                propertyJoinCodeService.validateAndApplyJoinCode(joinCode.code(), newStaff.getId());

        assertEquals(caretakerCodes, authFacade.getPermissionsByMembershipIds(Set.of(result.membershipId())).get(result.membershipId()));

        MeDTOs.MembershipSummary caretakerContext = meService.getUserContext(newStaff.getId()).managedProperties().stream()
                .filter(m -> m.propertyId().equals(property.getId()))
                .findFirst()
                .orElseThrow();
        assertEquals(caretakerCodes, caretakerContext.permissionCodes());

        MeDTOs.MembershipSummary ownerContext = meService.getUserContext(landlord.getId()).managedProperties().stream()
                .filter(m -> m.propertyId().equals(property.getId()))
                .findFirst()
                .orElseThrow();
        assertEquals(StaffPermission.allCodes(), ownerContext.permissionCodes());

        authenticate(newStaff);
        try {
            assertTrue(authorizationService.hasPermission(property.getId(), "METER_READING_CREATE"));
            assertTrue(authorizationService.hasPermission(property.getId(), "ISSUE_VIEW"));
            assertFalse(authorizationService.hasPermission(property.getId(), "LEDGER_VIEW"));
            assertFalse(authorizationService.hasPermission(property.getId(), "INVENTORY_VIEW"));
            assertFalse(authorizationService.hasPermission(property.getId(), "CHARGE_CONFIG_MANAGE"));
            assertFalse(authorizationService.hasPermission(property.getId(), "ANALYTICS_VIEW"));
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    public void joinCodeRejectsUnknownPermissionCodes() {
        BusinessException exception = assertThrows(BusinessException.class, () -> propertyJoinCodeService.generateJoinCode(
                property.getId(), "Caretaker", AccessType.CUSTOM_ACCESS, Set.of("METER_READING_VIEW", "PAYMENT_VIEW"), 1, landlord.getId()));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertTrue(exception.getMessage().contains("PAYMENT_VIEW"));
    }

    private void authenticate(UserTbl user) {
        UserDetailsImpl userDetails = UserDetailsImpl.fromClaims(user.getId().toString(), user.getAuthUid(), user.getGlobalRole().name());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities()));
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
