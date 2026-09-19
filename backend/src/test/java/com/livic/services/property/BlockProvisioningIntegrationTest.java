package com.livic.services.property;

import com.livic.platform.common.domain.UnitType;
import com.livic.platform.common.domain.UserRole;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.user.repository.UserRepository;
import com.livic.services.property.domain.BlockTbl;
import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.domain.UnitTbl;
import com.livic.services.property.dto.PropertyDTOs;
import com.livic.services.property.dto.UnitDTOs;
import com.livic.services.property.repository.BlockRepository;
import com.livic.services.property.repository.PropertyRepository;
import com.livic.services.property.repository.UnitRepository;
import com.livic.services.property.service.interfaces.PropertyService;
import com.livic.services.property.service.interfaces.UnitService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Units live in a block. Rental and residential properties keep one hidden default block;
 * societies will name their towers, which is what lets A-101 and B-101 co-exist.
 */
@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class BlockProvisioningIntegrationTest {

    @Autowired private PropertyService propertyService;
    @Autowired private UnitService unitService;
    @Autowired private UserRepository userRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private BlockRepository blockRepository;
    @Autowired private UnitRepository unitRepository;

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    /** Units go through subscription enforcement, which needs the owner authenticated. */
    private UserTbl authenticatedOwner() {
        UserTbl owner = userRepository.save(UserTbl.builder()
                .authUid("block-test-" + UUID.randomUUID() + "@test.com")
                .fullName("Block Owner")
                .failedLoginAttempts(0)
                .globalRole(UserRole.USER)
                .build());
        UserDetailsImpl principal = UserDetailsImpl.fromClaims(owner.getId().toString(), owner.getAuthUid(), "USER");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        return owner;
    }

    private PropertyTbl createProperty(String name) {
        UserTbl owner = authenticatedOwner();
        return propertyService.createProperty(new PropertyDTOs.CreatePropertyRequest(
                name, "1 Test St", "Test City", null, 2, List.of(), null), owner.getId());
    }

    private UnitDTOs.FloorLayoutUnitRequest layoutUnit(String unitNumber, int gridX) {
        return new UnitDTOs.FloorLayoutUnitRequest(
                unitNumber, gridX, 0, 1, 1, UnitType.SINGLE_UNIT, 2, null);
    }

    @Test
    @DisplayName("A new property gets exactly one default block")
    void newPropertyGetsADefaultBlock() {
        PropertyTbl property = createProperty("Default Block Property");

        List<BlockTbl> blocks = blockRepository.findByPropertyIdOrderBySortOrderAsc(property.getId());

        assertThat(blocks).hasSize(1);
        assertThat(blocks.get(0).isDefault()).isTrue();
        assertThat(blocks.get(0).getName()).isEqualTo(BlockTbl.DEFAULT_NAME);
    }

    @Test
    @DisplayName("Units created through the floor layout land in the property's default block")
    void unitsLandInTheDefaultBlock() {
        PropertyTbl property = createProperty("Layout Property");

        unitService.saveFloorLayout(property.getId(), 1, List.of(layoutUnit("101", 0), layoutUnit("102", 1)));

        BlockTbl defaultBlock = blockRepository.findFirstByPropertyIdAndIsDefaultTrue(property.getId()).orElseThrow();
        List<UnitTbl> units = unitRepository.findByPropertyId(property.getId());

        assertThat(units).hasSize(2);
        assertThat(units).allSatisfy(unit ->
                assertThat(unit.getBlock().getId()).isEqualTo(defaultBlock.getId()));
    }

    @Test
    @DisplayName("A property created without going through the service still gets a block on first unit")
    void legacyPropertyGetsABlockLazily() {
        authenticatedOwner();
        PropertyTbl property = propertyRepository.save(PropertyTbl.builder()
                .name("Legacy Property").address("2 Test St").city("Test City").totalFloors(1).build());

        unitService.saveFloorLayout(property.getId(), 1, List.of(layoutUnit("201", 0)));

        assertThat(blockRepository.findFirstByPropertyIdAndIsDefaultTrue(property.getId())).isPresent();
        assertThat(unitRepository.findByPropertyId(property.getId()).get(0).getBlock()).isNotNull();
    }

    @Test
    @DisplayName("The same unit number can exist in two blocks, but not twice in one block")
    void unitNumbersAreUniquePerBlockNotPerProperty() {
        PropertyTbl property = createProperty("Two Tower Property");
        BlockTbl towerA = blockRepository.findFirstByPropertyIdAndIsDefaultTrue(property.getId()).orElseThrow();
        BlockTbl towerB = blockRepository.save(BlockTbl.builder()
                .property(property).name("Tower B").sortOrder(1).isDefault(false).build());

        unitRepository.save(unit(property, towerA, "101"));
        unitRepository.saveAndFlush(unit(property, towerB, "101"));

        assertThat(unitRepository.findByPropertyId(property.getId())).hasSize(2);

        assertThatThrownBy(() -> unitRepository.saveAndFlush(unit(property, towerB, "101")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Deleting a property removes its blocks as well as its units")
    void deletingAPropertyRemovesItsBlocks() {
        UserTbl owner = authenticatedOwner();
        PropertyTbl property = propertyService.createProperty(new PropertyDTOs.CreatePropertyRequest(
                "Disposable Property", "3 Test St", "Test City", null, 1, List.of(), null), owner.getId());
        unitService.saveFloorLayout(property.getId(), 1, List.of(layoutUnit("301", 0)));

        propertyService.deleteProperty(property.getId());

        assertThat(blockRepository.findByPropertyIdOrderBySortOrderAsc(property.getId())).isEmpty();
        assertThat(unitRepository.findByPropertyId(property.getId())).isEmpty();
    }

    private UnitTbl unit(PropertyTbl property, BlockTbl block, String unitNumber) {
        return UnitTbl.builder()
                .property(property)
                .block(block)
                .unitNumber(unitNumber)
                .floor(1)
                .capacity(2)
                .gridX(0)
                .gridY(0)
                .type(UnitType.SINGLE_UNIT)
                .build();
    }
}
