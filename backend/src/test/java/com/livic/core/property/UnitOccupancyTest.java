package com.livic.core.property;

import com.livic.core.property.domain.UnitOccupancy;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Occupancy from active members: tenants fill beds, and anyone else living there makes the unit occupied. */
class UnitOccupancyTest {

    @Test
    void noMembersIsVacant() {
        assertThat(UnitOccupancy.of(0, 0, 2)).isEqualTo(UnitOccupancy.VACANT);
    }

    @Test
    void someBedsTakenIsPartial() {
        assertThat(UnitOccupancy.of(1, 1, 2)).isEqualTo(UnitOccupancy.PARTIAL);
    }

    @Test
    void allBedsTakenIsFull() {
        assertThat(UnitOccupancy.of(2, 2, 2)).isEqualTo(UnitOccupancy.FULL);
    }

    @Test
    void overbookedUnitIsStillFull() {
        assertThat(UnitOccupancy.of(3, 3, 2)).isEqualTo(UnitOccupancy.FULL);
    }

    @Test
    void ownerOccupiedUnitIsFull() {
        assertThat(UnitOccupancy.of(0, 1, 2)).isEqualTo(UnitOccupancy.FULL);
    }

    @Test
    void capacityCountsTenantsOnly() {
        // An owner and their family living with one tenant still leave the second bed free.
        assertThat(UnitOccupancy.of(1, 3, 2)).isEqualTo(UnitOccupancy.PARTIAL);
    }

    @Test
    void missingOrZeroCapacityMeansSingleBed() {
        assertThat(UnitOccupancy.of(1, 1, null)).isEqualTo(UnitOccupancy.FULL);
        assertThat(UnitOccupancy.of(1, 1, 0)).isEqualTo(UnitOccupancy.FULL);
        assertThat(UnitOccupancy.of(0, 0, null)).isEqualTo(UnitOccupancy.VACANT);
    }
}
