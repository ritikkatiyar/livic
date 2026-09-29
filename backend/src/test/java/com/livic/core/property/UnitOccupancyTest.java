package com.livic.core.property;

import com.livic.core.property.domain.UnitOccupancy;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UnitOccupancyTest {

    @Test
    void noActiveLeasesIsVacant() {
        assertThat(UnitOccupancy.of(0, 2)).isEqualTo(UnitOccupancy.VACANT);
    }

    @Test
    void someBedsTakenIsPartial() {
        assertThat(UnitOccupancy.of(1, 2)).isEqualTo(UnitOccupancy.PARTIAL);
    }

    @Test
    void allBedsTakenIsFull() {
        assertThat(UnitOccupancy.of(2, 2)).isEqualTo(UnitOccupancy.FULL);
    }

    @Test
    void overbookedUnitIsStillFull() {
        assertThat(UnitOccupancy.of(3, 2)).isEqualTo(UnitOccupancy.FULL);
    }

    @Test
    void missingOrZeroCapacityMeansSingleBed() {
        assertThat(UnitOccupancy.of(1, null)).isEqualTo(UnitOccupancy.FULL);
        assertThat(UnitOccupancy.of(1, 0)).isEqualTo(UnitOccupancy.FULL);
        assertThat(UnitOccupancy.of(0, null)).isEqualTo(UnitOccupancy.VACANT);
    }
}
