package com.livic.verticals.rental.billing;

import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.domain.BillType;
import com.livic.core.finance.dto.BillDTOs.GenerateBillRequest;
import com.livic.core.finance.repository.BillRepository;
import com.livic.core.finance.repository.ChargeConfigRepository;
import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.verticals.rental.billing.job.AutoBillingJob;
import com.livic.verticals.rental.billing.service.interfaces.BillingWorksheetService;
import com.livic.verticals.rental.billing.service.interfaces.RentGenerationService;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.verticals.rental.lease.service.interfaces.LeaseQueryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AutoBillingJobTest {

    @Mock
    private PropertyFacade propertyFacade;
    @Mock
    private ChargeConfigRepository chargeConfigRepository;
    @Mock
    private BillingWorksheetService worksheetService;
    @Mock
    private LeaseQueryService leaseQueryService;
    @Mock
    private RentGenerationService rentGenerationService;
    @Mock
    private BillRepository billRepository;
    @Mock
    private UnitMemberFacade unitMemberFacade;

    @InjectMocks
    private AutoBillingJob job;

    @Test
    @DisplayName("On bill day the job bills only leases with no rent bill for the month, leaving existing bills alone")
    void billsOnlyLeasesWithoutABill() {
        LocalDate today = LocalDate.now();
        String billingMonth = today.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        UUID propertyId = UUID.randomUUID();
        when(propertyFacade.getPropertiesByAutoBillDayOfMonth(today.getDayOfMonth())).thenReturn(List.of(
                new PropertySummaryDTO(propertyId, "Palm Court", "1 Test St", "City", null, true, today.getDayOfMonth())));
        when(chargeConfigRepository.findAllByPropertyIdAndIsActiveTrue(propertyId)).thenReturn(List.of());

        LeaseTbl alreadyBilled = lease();
        LeaseTbl notYetBilled = lease();
        UUID alreadyBilledMemberId = UUID.randomUUID();
        when(unitMemberFacade.getActiveResidentsByPropertyId(propertyId)).thenReturn(List.of(
                resident(alreadyBilledMemberId, alreadyBilled, propertyId),
                resident(UUID.randomUUID(), notYetBilled, propertyId)));
        when(billRepository.findByPropertyIdAndBillingMonth(propertyId, billingMonth)).thenReturn(List.of(
                BillTbl.builder().memberId(alreadyBilledMemberId).billType(BillType.RENT).build()));
        when(leaseQueryService.findActiveLeasesByProperty(propertyId)).thenReturn(List.of(alreadyBilled, notYetBilled));

        job.executeAutoBilling();

        ArgumentCaptor<GenerateBillRequest> generated = ArgumentCaptor.forClass(GenerateBillRequest.class);
        verify(rentGenerationService, times(1)).generate(generated.capture());
        assertThat(generated.getValue().leaseId()).isEqualTo(notYetBilled.getId());
        assertThat(generated.getValue().billingMonth()).isEqualTo(billingMonth);
    }

    @Test
    @DisplayName("The job runs once a day, not every hour")
    void runsOnceADay() throws NoSuchMethodException {
        Scheduled scheduled = AutoBillingJob.class.getMethod("executeAutoBilling").getAnnotation(Scheduled.class);

        assertThat(scheduled.cron()).isEqualTo("0 0 0 * * *");
    }

    private static LeaseTbl lease() {
        LeaseTbl lease = new LeaseTbl();
        lease.setId(UUID.randomUUID());
        lease.setUnitId(UUID.randomUUID());
        return lease;
    }

    private static UnitResidentDTO resident(UUID memberId, LeaseTbl lease, UUID propertyId) {
        return new UnitResidentDTO(memberId, UUID.randomUUID(), UnitMemberRole.TENANT, lease.getId(), lease.getUnitId(), "101", 1, propertyId);
    }
}
