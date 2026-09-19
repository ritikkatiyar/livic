package com.livic.core.property;

import com.livic.platform.common.domain.LeaseSplitStrategy;
import com.livic.platform.common.domain.UnitType;
import com.livic.platform.common.domain.UserRole;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.repository.UserRepository;
import com.livic.core.finance.dto.LeaseDTOs;
import com.livic.core.finance.domain.LeaseTbl;
import com.livic.core.finance.service.interfaces.LeaseService;
import com.livic.core.property.domain.BlockTbl;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.domain.UnitMemberTbl;
import com.livic.core.property.domain.UnitTbl;
import com.livic.core.property.repository.PropertyRepository;
import com.livic.core.property.repository.UnitMemberRepository;
import com.livic.core.property.repository.UnitRepository;
import com.livic.core.property.service.interfaces.BlockService;
import com.livic.core.property.service.interfaces.UnitMemberService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * A tenant is two records that must stay in step: the lease (what was agreed) and the unit
 * member (who is in the flat). Creating or ending a lease writes both in one transaction.
 */
@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class UnitMemberLeaseSyncIntegrationTest {

    @Autowired private LeaseService leaseService;
    @Autowired private UnitMemberService unitMemberService;
    @Autowired private UnitMemberRepository unitMemberRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private UnitRepository unitRepository;
    @Autowired private BlockService blockService;

    private UserTbl landlord;
    private UserTbl tenant;
    private UnitTbl unit;

    @BeforeEach
    void setUp() {
        landlord = userRepository.save(user("landlord", UserRole.USER));
        tenant = userRepository.save(user("tenant", UserRole.USER));

        PropertyTbl property = propertyRepository.save(PropertyTbl.builder()
                .name("Member Sync Property").address("4 Test St").city("Test City").totalFloors(1).build());
        BlockTbl block = blockService.getOrCreateDefaultBlock(property);

        unit = unitRepository.save(UnitTbl.builder()
                .property(property).block(block).unitNumber("401").floor(1).capacity(2)
                .gridX(0).gridY(0).type(UnitType.SINGLE_UNIT).build());
    }

    private UserTbl user(String prefix, UserRole role) {
        return UserTbl.builder()
                .authUid(prefix + "-" + UUID.randomUUID() + "@test.com")
                .fullName(prefix + " user")
                .phoneNumber("+91" + (9000000000L + (long) (Math.random() * 999999999)))
                .failedLoginAttempts(0)
                .globalRole(role)
                .build();
    }

    private LeaseTbl createLease() {
        return leaseService.createLease(new LeaseDTOs.CreateLeaseRequest(
                tenant.getId(), unit.getId(), new BigDecimal("15000"), new BigDecimal("30000"),
                LeaseSplitStrategy.FULL_UNIT, LocalDate.now(), null, null, null), landlord.getId());
    }

    @Test
    @DisplayName("Creating a lease makes the tenant a member of the unit")
    void creatingALeaseAddsTheTenantAsMember() {
        LeaseTbl lease = createLease();

        List<UnitMemberTbl> members = unitMemberRepository.findByUnitIdAndIsActiveTrue(unit.getId());

        assertThat(members).hasSize(1);
        UnitMemberTbl member = members.get(0);
        assertThat(member.getUserId()).isEqualTo(tenant.getId());
        assertThat(member.getRole()).isEqualTo(UnitMemberRole.TENANT);
        assertThat(member.getLeaseId()).isEqualTo(lease.getId());
        assertThat(member.getFromDate()).isEqualTo(lease.getMoveInDate());
        assertThat(member.isPrimary()).isTrue();
    }

    @Test
    @DisplayName("Ending a lease ends the membership but keeps the row for history")
    void endingALeaseEndsTheMembership() {
        LeaseTbl lease = createLease();

        leaseService.terminateLease(lease.getId());

        assertThat(unitMemberRepository.findByUnitIdAndIsActiveTrue(unit.getId())).isEmpty();

        List<UnitMemberTbl> history = unitMemberRepository.findByLeaseId(lease.getId());
        assertThat(history).hasSize(1);
        assertThat(history.get(0).isActive()).isFalse();
        assertThat(history.get(0).getToDate()).isNotNull();
    }

    @Test
    @DisplayName("Every active tenant member has an active lease behind it")
    void activeMembersAlwaysHaveALease() {
        LeaseTbl lease = createLease();

        List<UnitMemberTbl> active = unitMemberRepository.findByUnitIdAndIsActiveTrue(unit.getId());

        assertThat(active).allSatisfy(member -> {
            assertThat(member.getRole()).isEqualTo(UnitMemberRole.TENANT);
            assertThat(member.getLeaseId()).isEqualTo(lease.getId());
        });
    }

    @Test
    @DisplayName("The unit's members can be found by user and by property")
    void membersAreFoundByUserAndProperty() {
        createLease();

        assertThat(unitMemberService.findActiveByUserId(tenant.getId())).hasSize(1);
        assertThat(unitMemberService.findActiveByPropertyId(unit.getProperty().getId())).hasSize(1);
        assertThat(unitMemberService.isActiveMember(tenant.getId(), unit.getId(), UnitMemberRole.TENANT)).isTrue();
        assertThat(unitMemberService.isActiveMember(landlord.getId(), unit.getId(), UnitMemberRole.TENANT)).isFalse();
    }
}
