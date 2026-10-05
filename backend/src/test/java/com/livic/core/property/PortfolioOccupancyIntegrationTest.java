package com.livic.core.property;

import com.livic.core.community.analytics.dto.PortfolioOccupancyResponse;
import com.livic.core.community.analytics.mapper.AnalyticsMapper;
import com.livic.core.property.domain.BlockTbl;
import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.domain.UnitTbl;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.property.dto.PropertyOccupancySummaryDTO;
import com.livic.core.property.repository.PropertyRepository;
import com.livic.core.property.repository.UnitRepository;
import com.livic.core.property.service.interfaces.BlockService;
import com.livic.verticals.rental.lease.domain.LeaseSplitStrategy;
import com.livic.verticals.rental.lease.domain.LeaseStatus;
import com.livic.core.property.domain.UnitType;
import com.livic.platform.common.domain.UserRole;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.repository.UserRepository;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.verticals.rental.lease.repository.LeaseRepository;
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
 * Occupancy is counted per unit from its members: a shared room with two tenants is one occupied unit and
 * two occupied beds, so the occupancy rate can never pass 100%; an owner living in their flat occupies it.
 */
@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class PortfolioOccupancyIntegrationTest {

    @Autowired private PropertyFacade propertyFacade;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private UnitRepository unitRepository;
    @Autowired private BlockService blockService;
    @Autowired private LeaseRepository leaseRepository;
    @Autowired private com.livic.core.property.service.interfaces.UnitMemberService unitMemberService;
    @Autowired private UserRepository userRepository;

    @Test
    @DisplayName("A shared room with two tenants is one occupied unit, not two")
    void sharedRoomWithTwoTenantsCountsAsOneOccupiedUnit() {
        PropertyTbl property = propertyRepository.save(PropertyTbl.builder()
                .name("Shared Room PG").address("7 Test St").city("Test City").build());
        BlockTbl block = blockService.getOrCreateDefaultBlock(property);
        UnitTbl sharedRoom = unitRepository.save(unit(property, block, "101", 2));
        UnitTbl singleRoom = unitRepository.save(unit(property, block, "102", 1));

        leaseRepository.save(lease(sharedRoom, LeaseStatus.ACTIVE));
        leaseRepository.save(lease(sharedRoom, LeaseStatus.ACTIVE));
        leaseRepository.save(lease(singleRoom, LeaseStatus.ENDED));

        List<PropertyOccupancySummaryDTO> rows = propertyFacade.getOccupancyByProperty(List.of(property.getId()));

        assertThat(rows).hasSize(1);
        PropertyOccupancySummaryDTO row = rows.get(0);
        assertThat(row.totalUnits()).isEqualTo(2);
        assertThat(row.occupiedUnits()).isEqualTo(1);
        assertThat(row.fullUnits()).isEqualTo(1);
        assertThat(row.partialUnits()).isZero();
        assertThat(row.vacantUnits()).isEqualTo(1);
        assertThat(row.totalBeds()).isEqualTo(3);
        assertThat(row.occupiedBeds()).isEqualTo(2);
        assertThat(row.activeTenants()).isEqualTo(2);

        PortfolioOccupancyResponse response = AnalyticsMapper.toPortfolioOccupancyResponse(row);
        assertThat(response.occupiedUnits()).isEqualTo(1);
        assertThat(response.occupancyRate()).isEqualByComparingTo("50");
        assertThat(response.netYield()).isEqualByComparingTo("4");
        assertThat(response.bedOccupancyRate()).isEqualByComparingTo("66.67");
        assertThat(response.activeTenants()).isEqualTo(2);
    }

    @Test
    @DisplayName("A property whose only room is a full shared room is 100% occupied, not 200%")
    void fullSharedRoomIsAtMostOneHundredPercent() {
        PropertyTbl property = propertyRepository.save(PropertyTbl.builder()
                .name("Single Shared Room PG").address("8 Test St").city("Test City").build());
        UnitTbl sharedRoom = unitRepository.save(unit(property, blockService.getOrCreateDefaultBlock(property), "201", 2));
        leaseRepository.save(lease(sharedRoom, LeaseStatus.ACTIVE));
        leaseRepository.save(lease(sharedRoom, LeaseStatus.ACTIVE));

        PortfolioOccupancyResponse response = AnalyticsMapper.toPortfolioOccupancyResponse(
                propertyFacade.getOccupancyByProperty(List.of(property.getId())).get(0));

        assertThat(response.totalUnits()).isEqualTo(1);
        assertThat(response.occupiedUnits()).isEqualTo(1);
        assertThat(response.occupancyRate()).isEqualByComparingTo("100");
        assertThat(response.bedOccupancyRate()).isEqualByComparingTo("100");
        assertThat(response.activeTenants()).isEqualTo(2);
    }

    @Test
    @DisplayName("An owner-occupied flat is occupied, and its beds stay free for tenants")
    void ownerOccupiedUnitIsOccupiedWithoutTakingBeds() {
        PropertyTbl property = propertyRepository.save(PropertyTbl.builder()
                .name("Owner Flats").address("10 Test St").city("Test City").build());
        BlockTbl block = blockService.getOrCreateDefaultBlock(property);
        UnitTbl ownerFlat = unitRepository.save(unit(property, block, "301", 2));
        unitRepository.save(unit(property, block, "302", 1));
        unitMemberService.addMember(ownerFlat.getId(), user().getId(), UnitMemberRole.OWNER, true,
                LocalDate.now().minusYears(1), null);

        PropertyOccupancySummaryDTO row = propertyFacade.getOccupancyByProperty(List.of(property.getId())).get(0);

        assertThat(row.occupiedUnits()).isEqualTo(1);
        assertThat(row.fullUnits()).isEqualTo(1);
        assertThat(row.vacantUnits()).isEqualTo(1);
        assertThat(row.occupiedBeds()).isZero();
        assertThat(row.activeTenants()).isZero();
    }

    @Test
    @DisplayName("A property with no units still appears with zero occupancy")
    void propertyWithoutUnitsHasZeroOccupancy() {
        PropertyTbl property = propertyRepository.save(PropertyTbl.builder()
                .name("Empty PG").address("9 Test St").city("Test City").build());

        PortfolioOccupancyResponse response = AnalyticsMapper.toPortfolioOccupancyResponse(
                propertyFacade.getOccupancyByProperty(List.of(property.getId())).get(0));

        assertThat(response.totalUnits()).isZero();
        assertThat(response.totalBeds()).isZero();
        assertThat(response.occupancyRate()).isEqualByComparingTo("0");
        assertThat(response.bedOccupancyRate()).isEqualByComparingTo("0");
    }

    private UnitTbl unit(PropertyTbl property, BlockTbl block, String number, int capacity) {
        return UnitTbl.builder()
                .property(property).block(block).unitNumber(number).floor(1).capacity(capacity)
                .gridX(Integer.parseInt(number) % 100).gridY(0).type(UnitType.SINGLE_UNIT).build();
    }

    private UserTbl user() {
        return userRepository.save(UserTbl.builder()
                .authUid("tenant-" + UUID.randomUUID() + "@test.com")
                .fullName("tenant user")
                .phoneNumber("+91" + (9000000000L + (long) (Math.random() * 999999999)))
                .failedLoginAttempts(0)
                .globalRole(UserRole.USER)
                .build());
    }

    private LeaseTbl lease(UnitTbl unit, LeaseStatus status) {
        UserTbl tenant = user();
        var member = unitMemberService.addTenant(unit.getId(), tenant.getId(), LocalDate.now().minusDays(30), null);
        if (status == LeaseStatus.ENDED) {
            unitMemberService.endMember(member.getId(), LocalDate.now());
        }
        return LeaseTbl.builder()
                .userId(tenant.getId())
                .unitId(unit.getId())
                .memberId(member.getId())
                .status(status)
                .monthlyRentAmount(BigDecimal.valueOf(8000))
                .securityDeposit(BigDecimal.valueOf(16000))
                .splitStrategy(LeaseSplitStrategy.PER_OCCUPANT)
                .moveInDate(LocalDate.now().minusDays(30))
                .build();
    }
}
