package com.livic.core.property;

import com.livic.platform.auth.service.interfaces.MembershipService;
import com.livic.platform.common.domain.UnitType;
import com.livic.platform.common.domain.UserRole;
import com.livic.platform.common.exception.BusinessException;
import com.livic.core.property.controller.UnitController;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.dto.PropertyDTOs.BatchUnitRequest;
import com.livic.core.property.dto.UnitDTOs.FloorLayoutUnitRequest;
import com.livic.core.property.repository.PropertyRepository;
import com.livic.core.property.repository.UnitRepository;
import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * STARTER (free) plan allows 5 units in total. Goes through the controller beans so the
 * subscription and permission checks run as they do for HTTP requests.
 */
@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class UnitLimitEnforcementIntegrationTest {

    private static final int STARTER_MAX_UNITS = 5;

    @Autowired private UnitController unitController;
    @Autowired private UserRepository userRepository;
    @Autowired private PropertyRepository propertyRepository;
    @Autowired private UnitRepository unitRepository;
    @Autowired private MembershipService membershipService;

    private PropertyTbl property;

    @BeforeEach
    void setUp() {
        UserTbl landlord = userRepository.save(UserTbl.builder()
                .authUid("unit-limit-" + UUID.randomUUID() + "@test.com")
                .fullName("Free Landlord")
                .failedLoginAttempts(0)
                .globalRole(UserRole.USER)
                .build());
        property = propertyRepository.save(PropertyTbl.builder()
                .name("Free Property")
                .address("1 Test St")
                .city("Test City")
                .build());
        membershipService.createOwnerMembership(property.getId(), landlord.getId());

        UserDetailsImpl principal = UserDetailsImpl.fromClaims(landlord.getId().toString(), landlord.getAuthUid(), "USER");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void batchCannotCreateMoreUnitsThanThePlanAllows() {
        BusinessException denied = assertThrows(BusinessException.class,
                () -> unitController.generateBatchUnits(property.getId(), batch(STARTER_MAX_UNITS + 1)));

        assertEquals(HttpStatus.FORBIDDEN, denied.getStatus());
        assertEquals(0, unitCount());
    }

    @Test
    void batchUpToThePlanLimitIsAllowed() {
        assertDoesNotThrow(() -> unitController.generateBatchUnits(property.getId(), batch(STARTER_MAX_UNITS)));
        assertEquals(STARTER_MAX_UNITS, unitCount());
    }

    @Test
    void floorLayoutCannotAddUnitsBeyondThePlanLimit() {
        unitController.saveFloorLayout(property.getId(), 1, null, layout(STARTER_MAX_UNITS));

        BusinessException denied = assertThrows(BusinessException.class,
                () -> unitController.saveFloorLayout(property.getId(), 1, null, layout(STARTER_MAX_UNITS + 1)));

        assertEquals(HttpStatus.FORBIDDEN, denied.getStatus());
        assertEquals(STARTER_MAX_UNITS, unitCount());
    }

    @Test
    void floorLayoutEditsWithoutNewUnitsAreAllowedAtTheLimit() {
        unitController.saveFloorLayout(property.getId(), 1, null, layout(STARTER_MAX_UNITS));

        // Same unit numbers, so nothing new is created
        assertDoesNotThrow(() -> unitController.saveFloorLayout(property.getId(), 1, null, layout(STARTER_MAX_UNITS)));
        assertEquals(STARTER_MAX_UNITS, unitCount());
    }

    private long unitCount() {
        return unitRepository.findAll().stream()
                .filter(unit -> unit.getProperty().getId().equals(property.getId()))
                .count();
    }

    private static BatchUnitRequest batch(int units) {
        return new BatchUnitRequest(1, units, 1, "A", 1, UnitType.STUDIO, null);
    }

    private static List<FloorLayoutUnitRequest> layout(int units) {
        return IntStream.rangeClosed(1, units)
                .mapToObj(i -> new FloorLayoutUnitRequest("L" + i, i - 1, 0, 1, 1, UnitType.STUDIO, 1, null))
                .toList();
    }
}
