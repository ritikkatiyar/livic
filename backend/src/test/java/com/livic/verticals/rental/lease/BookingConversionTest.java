package com.livic.verticals.rental.lease;

import com.livic.core.finance.facade.FinanceFacade;
import com.livic.core.property.dto.UnitMemberSummaryDTO;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.facade.UnitFacade;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import com.livic.verticals.rental.booking.dto.UnitBookingDTOs.UnitBookingResponse;
import com.livic.verticals.rental.booking.facade.BookingFacade;
import com.livic.verticals.rental.lease.domain.LeaseSplitStrategy;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.verticals.rental.lease.dto.LeaseDTOs;
import com.livic.verticals.rental.lease.repository.LeaseRepository;
import com.livic.verticals.rental.lease.service.impl.LeaseServiceImpl;
import com.livic.verticals.rental.lease.service.interfaces.LeaseQueryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** A booking becomes a lease for the person who booked, who has signed up; nobody gets an account made for them. */
@ExtendWith(MockitoExtension.class)
class BookingConversionTest {

    @Mock private LeaseRepository leaseRepository;
    @Mock private LeaseQueryService leaseQueryService;
    @Mock private UnitFacade unitFacade;
    @Mock private UnitMemberFacade unitMemberFacade;
    @Mock private UserFacade userFacade;
    @Mock private BookingFacade bookingFacade;
    @Mock private FinanceFacade financeFacade;

    @InjectMocks private LeaseServiceImpl leaseService;

    private final UUID unitId = UUID.randomUUID();
    private final UUID bookingId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        when(leaseQueryService.isUnitAvailableOnDate(eq(unitId), any())).thenReturn(true);
        when(unitFacade.getUnitById(unitId)).thenReturn(Optional.of(new UnitSummaryDTO(
                unitId, UUID.randomUUID(), "PG", "101", 1, 1, 0, 0, 1, 1, null, null)));
        when(bookingFacade.getConvertibleBooking(bookingId)).thenReturn(new UnitBookingResponse(
                bookingId, unitId, "101", null, "Asha", "98765 43210", null, BigDecimal.valueOf(2000),
                LocalDate.now(), "CONFIRMED", UUID.randomUUID(), null, null, null));
    }

    private LeaseDTOs.CreateLeaseRequest fromBooking() {
        return new LeaseDTOs.CreateLeaseRequest(null, unitId, BigDecimal.valueOf(10000), BigDecimal.valueOf(20000),
                LeaseSplitStrategy.FULL_UNIT, LocalDate.now(), null, null, bookingId);
    }

    @Test
    @DisplayName("A prospect without an account is asked to sign up; no account is made for them")
    void prospectWithoutAccountIsRefused() {
        when(userFacade.findByPhoneNumber("98765 43210")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> leaseService.createLease(fromBooking(), UUID.randomUUID()))
                .isInstanceOfSatisfying(BusinessException.class, e -> {
                    assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(e.getMessage()).contains("sign up with 98765 43210");
                });
        verify(userFacade, never()).createUser(anyString(), anyString(), anyString(), anyString());
        verify(leaseRepository, never()).save(any());
    }

    @Test
    @DisplayName("A prospect who signed up with the booking's phone gets the lease")
    void prospectFoundByPhoneGetsTheLease() {
        UUID asha = UUID.randomUUID();
        UserSummaryDTO user = new UserSummaryDTO(asha, "asha@example.com", "Asha", "+919876543210", null);
        when(userFacade.findByPhoneNumber("98765 43210")).thenReturn(Optional.of(user));
        when(userFacade.getUserById(asha)).thenReturn(Optional.of(user));
        when(unitMemberFacade.addTenant(eq(unitId), eq(asha), any(), any())).thenReturn(new UnitMemberSummaryDTO(
                UUID.randomUUID(), unitId, asha, UnitMemberRole.TENANT, true, LocalDate.now(), null, true));
        when(leaseRepository.save(any(LeaseTbl.class))).thenAnswer(i -> {
            LeaseTbl lease = i.getArgument(0);
            lease.setId(UUID.randomUUID());
            return lease;
        });

        LeaseTbl lease = leaseService.createLease(fromBooking(), UUID.randomUUID());

        assertThat(lease.getUserId()).isEqualTo(asha);
        verify(bookingFacade).markConverted(eq(bookingId), any());
        verify(userFacade, never()).createUser(anyString(), anyString(), anyString(), anyString());
    }
}
