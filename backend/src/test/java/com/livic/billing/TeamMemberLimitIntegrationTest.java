package com.livic.billing;

import com.livic.auth.repository.MembershipRepository;
import com.livic.auth.service.interfaces.MembershipService;
import com.livic.billing.repository.SaasSubscriptionRepository;
import com.livic.billing.repository.SubscriptionPlanRepository;
import com.livic.common.domain.UserRole;
import com.livic.common.enums.AccessType;
import com.livic.common.exception.BusinessException;
import com.livic.property.domain.PropertyTbl;
import com.livic.property.repository.PropertyRepository;
import com.livic.user.domain.UserTbl;
import com.livic.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * MAX_TEAM_MEMBERS is per property, includes the owner, and uses the owner's plan:
 * STARTER = 1 (owner only), BASIC = 3.
 */
@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class TeamMemberLimitIntegrationTest {

    @Autowired private MembershipService membershipService;
    @Autowired private MembershipRepository membershipRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private SaasSubscriptionRepository subscriptionRepository;
    @Autowired private SubscriptionPlanRepository planRepository;

    private UserTbl owner;
    private PropertyTbl property;

    @BeforeEach
    void setUp() {
        owner = newUser("owner");
        property = propertyRepository.save(PropertyTbl.builder()
                .name("Team Property")
                .address("1 Test St")
                .city("Test City")
                .totalFloors(1)
                .build());
        membershipService.createOwnerMembership(property.getId(), owner.getId());
    }

    @Test
    void starterOwnerCannotAddStaff() {
        UserTbl staff = newUser("staff");

        BusinessException denied = assertThrows(BusinessException.class, () -> addMember(staff));

        assertEquals(HttpStatus.FORBIDDEN, denied.getStatus());
        assertFalse(membershipRepository.existsByUserIdAndPropertyId(staff.getId(), property.getId()));
    }

    @Test
    void basicOwnerCanFillThreeSeatsIncludingTheOwner() {
        subscribeOwnerToBasic();
        addMember(newUser("staff1"));
        addMember(newUser("staff2"));

        UserTbl extra = newUser("staff3");
        BusinessException denied = assertThrows(BusinessException.class, () -> addMember(extra));

        assertEquals(HttpStatus.FORBIDDEN, denied.getStatus());
        assertFalse(membershipRepository.existsByUserIdAndPropertyId(extra.getId(), property.getId()));
    }

    @Test
    void reactivatingAMemberNeedsAFreeSeat() {
        subscribeOwnerToBasic();
        UUID staff1Membership = addMember(newUser("staff1"));
        addMember(newUser("staff2"));

        // Deactivating frees a seat, which a new member takes
        membershipService.toggleMembershipActive(property.getId(), staff1Membership, false, owner.getId());
        addMember(newUser("staff3"));

        BusinessException denied = assertThrows(BusinessException.class,
                () -> membershipService.toggleMembershipActive(property.getId(), staff1Membership, true, owner.getId()));
        assertEquals(HttpStatus.FORBIDDEN, denied.getStatus());
    }

    private UUID addMember(UserTbl user) {
        return membershipService.createMembership(property.getId(), user.getId(), "Staff",
                AccessType.CUSTOM_ACCESS, Set.of(), owner.getId()).getId();
    }

    private void subscribeOwnerToBasic() {
        SubscriptionTestSupport.subscribe(subscriptionRepository, planRepository, owner.getId(), SubscriptionTestSupport.BASIC_PLAN_ID);
    }

    private UserTbl newUser(String label) {
        return userRepository.save(UserTbl.builder()
                .authUid(label + "-" + UUID.randomUUID() + "@test.com")
                .fullName(label)
                .failedLoginAttempts(0)
                .globalRole(UserRole.USER)
                .build());
    }
}
