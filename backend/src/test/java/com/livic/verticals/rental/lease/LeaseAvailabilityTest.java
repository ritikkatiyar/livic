package com.livic.verticals.rental.lease;

import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.UnitFacade;
import com.livic.verticals.rental.lease.domain.LeaseStatus;
import com.livic.verticals.rental.lease.repository.LeaseRepository;
import com.livic.verticals.rental.lease.service.impl.LeaseQueryServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/** A unit takes as many tenancies at once as it has beds; nothing else in it takes a bed. */
@ExtendWith(MockitoExtension.class)
class LeaseAvailabilityTest {

    @Mock private LeaseRepository leaseRepository;
    @Mock private UnitFacade unitFacade;

    @InjectMocks private LeaseQueryServiceImpl leaseQueryService;

    private final UUID unitId = UUID.randomUUID();
    private final LocalDate date = LocalDate.now().plusDays(7);

    @Test
    @DisplayName("A shared room with one of two beds taken still has a vacancy")
    void sharedRoomWithAFreeBedIsAvailable() {
        unitWithCapacity(2);
        when(leaseRepository.countActiveLeasesOnDate(unitId, LeaseStatus.ACTIVE, date)).thenReturn(1L);

        assertThat(leaseQueryService.isUnitAvailableOnDate(unitId, date)).isTrue();
    }

    @Test
    @DisplayName("A room with every bed taken has no vacancy")
    void fullRoomIsNotAvailable() {
        unitWithCapacity(2);
        when(leaseRepository.countActiveLeasesOnDate(unitId, LeaseStatus.ACTIVE, date)).thenReturn(2L);

        assertThat(leaseQueryService.isUnitAvailableOnDate(unitId, date)).isFalse();
    }

    @Test
    @DisplayName("A unit without a capacity has one bed")
    void missingCapacityMeansOneBed() {
        unitWithCapacity(null);
        when(leaseRepository.countActiveLeasesOnDate(unitId, LeaseStatus.ACTIVE, date)).thenReturn(0L, 1L);

        assertThat(leaseQueryService.isUnitAvailableOnDate(unitId, date)).isTrue();
        assertThat(leaseQueryService.isUnitAvailableOnDate(unitId, date)).isFalse();
    }

    private void unitWithCapacity(Integer capacity) {
        when(unitFacade.getUnitById(unitId)).thenReturn(Optional.of(new UnitSummaryDTO(
                unitId, UUID.randomUUID(), "PG", "101", 1, capacity, 0, 0, 1, 1, null, null)));
    }
}
