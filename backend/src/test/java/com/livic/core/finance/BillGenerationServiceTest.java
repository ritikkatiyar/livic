package com.livic.core.finance;

import com.livic.core.finance.domain.BillLineTbl;
import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.domain.BillType;
import com.livic.core.finance.domain.CalculationStrategyType;
import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.core.finance.domain.LedgerTransactionType;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.core.finance.dto.BillDraft;
import com.livic.core.finance.repository.BillLineRepository;
import com.livic.core.finance.repository.BillRepository;
import com.livic.core.finance.repository.ChargeConfigRepository;
import com.livic.core.finance.service.impl.BillGenerationServiceImpl;
import com.livic.core.finance.service.interfaces.BillService;
import com.livic.core.finance.service.interfaces.BillingWorksheetService;
import com.livic.core.finance.service.interfaces.LedgerService;
import com.livic.core.finance.strategy.CalculationResult;
import com.livic.core.finance.strategy.ChargeCalculationService;
import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.platform.common.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.PlatformTransactionManager;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Core's bill engine: the draft's lines plus the property's charges, summed, and posted to the ledger. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BillGenerationServiceTest {

    @Mock private BillRepository billRepository;
    @Mock private BillLineRepository billLineRepository;
    @Mock private ChargeConfigRepository chargeConfigRepository;
    @Mock private ChargeCalculationService chargeCalculationService;
    @Mock private BillingWorksheetService worksheetService;
    @Mock private LedgerService ledgerService;
    @Mock private BillService billService;
    @Mock private UnitMemberFacade unitMemberFacade;
    @Mock private PlatformTransactionManager transactionManager;

    @InjectMocks private BillGenerationServiceImpl generationService;

    private final UUID propertyId = UUID.randomUUID();
    private final UUID unitId = UUID.randomUUID();
    private final UUID memberId = UUID.randomUUID();
    private UnitResidentDTO payer;

    @BeforeEach
    void setUp() {
        payer = new UnitResidentDTO(memberId, UUID.randomUUID(), UnitMemberRole.TENANT, null, unitId, "101", 1, propertyId);
        when(unitMemberFacade.getResidentByMemberId(memberId)).thenReturn(Optional.of(payer));
        when(unitMemberFacade.getResidentsByMemberIds(any())).thenReturn(List.of(payer));
        when(billRepository.findByMemberIdAndBillingMonthAndBillType(memberId, "2026-08", BillType.RENT)).thenReturn(Optional.empty());
        when(billRepository.save(any(BillTbl.class))).thenAnswer(i -> {
            BillTbl bill = i.getArgument(0);
            if (bill.getId() == null) bill.setId(UUID.randomUUID());
            return bill;
        });
    }

    @Test
    @DisplayName("The total is the sum of signed lines, so a discount lowers it")
    void negativeChargeLowersTheTotal() {
        ChargeConfigTbl discount = charge("Loyalty discount");
        when(chargeConfigRepository.findAllByPropertyIdAndIsActiveTrue(propertyId)).thenReturn(List.of(discount));
        when(chargeCalculationService.executeChargePipeline(discount, unitId, "2026-08", false))
                .thenReturn(new CalculationResult(BigDecimal.valueOf(-200), null));

        generationService.generate(draft(List.of(new BillDraft.Line("Rent", BigDecimal.valueOf(1500))), 1));

        BillTbl bill = savedBill();
        assertThat(bill.getTotalAmount()).isEqualByComparingTo("1300");
        assertThat(savedLines()).extracting(BillLineTbl::getDescription).containsExactly("Rent", "Loyalty discount");
        verify(worksheetService).prepareMonth(propertyId, "2026-08", null);
        verify(ledgerService).post(memberId, unitId, LedgerTransactionType.INVOICE_GENERATED,
                BigDecimal.valueOf(1300), bill.getId(), "Invoice Generation for 2026-08");
    }

    @Test
    @DisplayName("Roommates split the unit's charges, but each keeps their own rent")
    void chargesAreSharedByThePayersOfTheUnit() {
        ChargeConfigTbl electricity = charge("Electricity");
        when(chargeConfigRepository.findAllByPropertyIdAndIsActiveTrue(propertyId)).thenReturn(List.of(electricity));
        when(chargeCalculationService.executeChargePipeline(electricity, unitId, "2026-08", false))
                .thenReturn(new CalculationResult(BigDecimal.valueOf(300), "30 units"));

        generationService.generate(draft(List.of(new BillDraft.Line("Rent", BigDecimal.valueOf(1000))), 2));

        assertThat(savedLines()).extracting(BillLineTbl::getAmount)
                .usingElementComparator(BigDecimal::compareTo)
                .containsExactly(BigDecimal.valueOf(1000), BigDecimal.valueOf(150));
        assertThat(savedLines().get(1).getDescription()).isEqualTo("Electricity (30 units)");
    }

    @Test
    @DisplayName("A paid bill is never rewritten")
    void paidBillIsRefused() {
        BillTbl paid = BillTbl.builder().memberId(memberId).billType(BillType.RENT).billingMonth("2026-08")
                .status(BillStatus.PAID).totalAmount(BigDecimal.valueOf(1000)).build();
        paid.setId(UUID.randomUUID());
        when(billRepository.findByMemberIdAndBillingMonthAndBillType(memberId, "2026-08", BillType.RENT)).thenReturn(Optional.of(paid));

        assertThatThrownBy(() -> generationService.generate(draft(List.of(), 1)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("paid bill");
        verify(billLineRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("Regenerating posts only the change to the ledger")
    void regenerationPostsTheDifference() {
        BillTbl existing = BillTbl.builder().memberId(memberId).billType(BillType.RENT).billingMonth("2026-08")
                .status(BillStatus.PENDING).totalAmount(BigDecimal.valueOf(1000)).build();
        existing.setId(UUID.randomUUID());
        when(billRepository.findByMemberIdAndBillingMonthAndBillType(memberId, "2026-08", BillType.RENT)).thenReturn(Optional.of(existing));
        when(chargeConfigRepository.findAllByPropertyIdAndIsActiveTrue(propertyId)).thenReturn(List.of());

        generationService.generate(draft(List.of(new BillDraft.Line("Rent", BigDecimal.valueOf(1250))), 1));

        verify(ledgerService).post(memberId, unitId, LedgerTransactionType.ADJUSTMENT,
                BigDecimal.valueOf(250), existing.getId(), "Invoice Regeneration for 2026-08");
    }

    @Test
    @DisplayName("In a batch one failing bill does not stop the others, and responses are read once")
    void batchIsolatesFailures() {
        UUID strangerId = UUID.randomUUID();
        when(chargeConfigRepository.findAllByPropertyIdAndIsActiveTrue(propertyId)).thenReturn(List.of());
        when(billService.toResponses(anyList())).thenAnswer(i -> {
            List<BillTbl> bills = i.getArgument(0);
            return bills.stream().map(b -> new BillDTOs.BillResponse(b.getId(), null, "Payer", "101", "2026-08",
                    b.getTotalAmount(), null, BillStatus.PENDING, null, null, null, List.of())).toList();
        });

        List<BillDraft.Outcome> outcomes = generationService.generateAll(List.of(
                new BillDraft(strangerId, null, BillType.RENT, "2026-08", LocalDate.now(), List.of(), 1),
                draft(List.of(new BillDraft.Line("Rent", BigDecimal.valueOf(900))), 1)));

        assertThat(outcomes.get(0).bill()).isNull();
        assertThat(outcomes.get(0).failure()).contains("no unit member");
        assertThat(outcomes.get(1).bill()).isNotNull();
        assertThat(outcomes.get(1).bill().totalAmount()).isEqualByComparingTo("900");
        verify(billService, times(1)).toResponses(anyList());
        verify(billService, never()).getById(any());
    }

    private BillDraft draft(List<BillDraft.Line> lines, int shareCount) {
        return new BillDraft(memberId, null, BillType.RENT, "2026-08", LocalDate.now().plusDays(5), lines, shareCount);
    }

    private ChargeConfigTbl charge(String name) {
        ChargeConfigTbl charge = ChargeConfigTbl.builder().propertyId(propertyId).chargeName(name)
                .calculationStrategy(CalculationStrategyType.FIXED_RATE).isActive(true).build();
        charge.setId(UUID.randomUUID());
        return charge;
    }

    private BillTbl savedBill() {
        ArgumentCaptor<BillTbl> captor = ArgumentCaptor.forClass(BillTbl.class);
        verify(billRepository, org.mockito.Mockito.atLeastOnce()).save(captor.capture());
        return captor.getValue();
    }

    @SuppressWarnings("unchecked")
    private List<BillLineTbl> savedLines() {
        ArgumentCaptor<List<BillLineTbl>> captor = ArgumentCaptor.forClass(List.class);
        verify(billLineRepository).saveAll(captor.capture());
        return captor.getValue();
    }
}
