package com.livic.core.finance.service.impl;

import com.livic.core.finance.security.FinancePermissions;
import com.livic.platform.auth.facade.AuthFacade;
import com.livic.core.finance.listener.FinancePaymentEventListener;
import com.livic.core.finance.repository.MeterReadingRepository;
import com.livic.core.finance.repository.ChargeConfigRepository;
import com.livic.core.finance.repository.BillLineRepository;
import com.livic.core.finance.repository.BillingWorksheetRepository;
import com.livic.core.finance.repository.BillRepository;
import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.common.event.RentPublishedEvent;
import com.livic.platform.common.exception.BusinessException;
import com.livic.core.finance.domain.BillingWorksheetEntryTbl;
import com.livic.core.finance.domain.MeterReadingTbl;
import com.livic.core.finance.domain.BillLineTbl;
import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.domain.CalculationStrategyType;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.core.finance.dto.BillMetricsDTO;
import com.livic.core.finance.mapper.BillMapper;
import com.livic.core.finance.service.interfaces.BillService;
import com.livic.core.finance.specification.BillSpecifications;
import com.livic.platform.payment.dto.PaymentInitiationRequest;
import com.livic.platform.payment.dto.PaymentInitiationResponse;
import com.livic.platform.payment.facade.PaymentFacade;
import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.domain.UnitOccupancy;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.UnitFacade;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillServiceImpl implements BillService {

    private final BillRepository billRepository;
    private final BillLineRepository billLineRepository;
    private final BillingWorksheetRepository billingWorksheetRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final ChargeConfigRepository chargeConfigRepository;
    private final PaymentFacade paymentFacade;
    private final ApplicationEventPublisher eventPublisher;
    private final UserFacade userFacade;
    private final UnitFacade unitFacade;
    private final UnitMemberFacade unitMemberFacade;
    private final AuthFacade authFacade;

    @Override
    @Transactional(readOnly = true)
    public BillDTOs.BillResponse getById(UUID id) {
        return buildSingleResponse(billRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Bill not found")));
    }

    @Override
    @Transactional
    public PaymentInitiationResponse initiateOnlinePayment(UUID billId, UUID payerUserId) {
        log.info("Executing initiateOnlinePayment for Bill: {} by user: {}", billId, payerUserId);
        BillTbl bill = billRepository.findById(billId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Bill not found"));

        BigDecimal amountPaid = bill.getAmountPaid() != null ? bill.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal remainingAmount = bill.getTotalAmount().subtract(amountPaid);

        if (remainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Bill is already fully paid");
        }

        PaymentInitiationRequest initRequest = PaymentInitiationRequest.builder()
                .payerUserId(payerUserId)
                .referenceType(FinancePaymentEventListener.REFERENCE_TYPE)
                .referenceId(billId)
                .amount(remainingAmount)
                .paymentMethod("ONLINE")
                .description("Bill online payment")
                .build();

        return paymentFacade.initiateOnlinePayment(initRequest);
    }

    @Override
    @Transactional
    public PaymentInitiationResponse recordCashPayment(UUID billId, BigDecimal amount, String note, UUID payerUserId, UUID confirmedBy) {
        log.info("Executing recordCashPayment for Bill: {} amount: {}", billId, amount);
        BillTbl bill = billRepository.findById(billId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Bill not found"));

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Valid positive amount is required");
        }

        UUID finalPayerId = payerUserId != null ? payerUserId : (payerOf(bill) != null ? payerUserIdOf(bill) : confirmedBy);

        PaymentInitiationRequest initRequest = PaymentInitiationRequest.builder()
                .payerUserId(finalPayerId)
                .referenceType(FinancePaymentEventListener.REFERENCE_TYPE)
                .referenceId(billId)
                .amount(amount)
                .paymentMethod("CASH")
                .confirmedBy(confirmedBy)
                .note(note)
                .description("Bill cash payment")
                .build();

        return paymentFacade.recordCashPayment(initRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public BillDTOs.BillListResponse list(UUID currentUserId, UUID propertyId, String billingMonth, BillStatus status, String search, Pageable pageable) {
        // Staff see the bills of the properties where they hold BILL_VIEW (FULL_ACCESS holds every
        // code). Being a member of a property is not enough, and paying a bill yourself is the
        // separate /me/bills view.
        Set<UUID> viewable = currentUserId == null ? Set.of()
                : authFacade.getEffectivePermissionCodes(currentUserId).entrySet().stream()
                        .filter(e -> e.getValue().contains(FinancePermissions.BILL_VIEW))
                        .map(Map.Entry::getKey)
                        .collect(Collectors.toSet());
        List<UUID> targetPropertyIds = propertyId == null
                ? List.copyOf(viewable)
                : viewable.contains(propertyId) ? List.of(propertyId) : List.of();
        if (targetPropertyIds.isEmpty()) {
            return new BillDTOs.BillListResponse(
                    List.of(), 0, 0, pageable.getPageSize(), pageable.getPageNumber(),
                    new BillMetricsDTO(BigDecimal.ZERO, 0L, 0L)
            );
        }

        // A bill carries its property and payer, so a property filters directly; no walk
        // through units.
        Specification<BillTbl> spec = Specification.where(BillSpecifications.hasPropertyIdIn(targetPropertyIds))
                .and(BillSpecifications.hasBillingMonth(billingMonth))
                .and(BillSpecifications.hasStatus(status));

        if (search != null && !search.trim().isEmpty()) {
            List<UUID> matchingUnitIds = unitFacade.getUnitIdsByUnitNumberSearch(search);
            List<UUID> matchingUserIds = userFacade.getUserIdsBySearch(search);
            Set<UUID> matchingMemberIds = new HashSet<>();
            matchingMemberIds.addAll(unitMemberFacade.getMemberIdsByUnitIds(matchingUnitIds));
            matchingMemberIds.addAll(unitMemberFacade.getMemberIdsByUserIds(matchingUserIds));
            spec = spec.and(BillSpecifications.hasMemberIdIn(matchingMemberIds));
        }

        Page<BillTbl> page = billRepository.findAll(spec, pageable);
        List<BillDTOs.BillResponse> content = toResponses(page.getContent());

        BillMetricsDTO billMetrics = billRepository.getBillMetrics(
                        targetPropertyIds,
                        billingMonth,
                        BillStatus.PENDING,
                        BillStatus.PUBLISHED,
                        BillStatus.PAID,
                        BillStatus.OVERDUE,
                        BillStatus.PARTIALLY_PAID
                );
        if (billMetrics == null) {
            billMetrics = new BillMetricsDTO(BigDecimal.ZERO, 0L, 0L);
        }

        return new BillDTOs.BillListResponse(
                content,
                page.getTotalElements(),
                page.getTotalPages(),
                page.getSize(),
                page.getNumber(),
                billMetrics
        );
    }

    @Override
    @Transactional(readOnly = true)
    public BillDTOs.BillListResponse listForMember(UUID memberId, String billingMonth, BillStatus status,
                                                  boolean includeUnpublished, Pageable pageable) {
        return listForMembers(Set.of(memberId), billingMonth, status, includeUnpublished, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public BillDTOs.BillListResponse listForPayer(UUID userId, String billingMonth, BillStatus status, Pageable pageable) {
        // Every unit the user pays for: as a tenant, or as an owner in a residential building.
        // Bills still being drafted are not theirs to see yet.
        Set<UUID> memberIds = unitMemberFacade.getActiveResidencesByUserId(userId).stream()
                .filter(r -> r.role() == UnitMemberRole.TENANT || r.role() == UnitMemberRole.OWNER)
                .map(UnitResidentDTO::memberId)
                .collect(Collectors.toSet());
        if (memberIds.isEmpty() || status == BillStatus.PENDING) {
            return new BillDTOs.BillListResponse(
                    List.of(), 0, 0, pageable.getPageSize(), pageable.getPageNumber(),
                    new BillMetricsDTO(BigDecimal.ZERO, 0L, 0L)
            );
        }
        return listForMembers(memberIds, billingMonth, status, false, pageable);
    }

    private BillDTOs.BillListResponse listForMembers(Set<UUID> memberIds, String billingMonth, BillStatus status,
                                                     boolean includeUnpublished, Pageable pageable) {
        Specification<BillTbl> spec = Specification.where(BillSpecifications.hasMemberIdIn(memberIds))
                .and(BillSpecifications.hasBillingMonth(billingMonth))
                .and(BillSpecifications.hasStatus(status));
        if (!includeUnpublished) {
            spec = spec.and(BillSpecifications.hasStatusNot(BillStatus.PENDING));
        }
        Page<BillTbl> page = billRepository.findAll(spec, pageable);
        return new BillDTOs.BillListResponse(
                toResponses(page.getContent()),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getSize(),
                page.getNumber(),
                new BillMetricsDTO(BigDecimal.ZERO, 0L, 0L)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public BillDTOs.PreFlightChecklistResponse getPreFlightChecklist(UUID propertyId, String billingMonth) {
        YearMonth month;
        try {
            month = YearMonth.parse(billingMonth);
        } catch (DateTimeParseException | NullPointerException e) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "billingMonth must use yyyy-MM");
        }

        List<UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        // People who pay (tenants, or owners in a residential building), not units: a shared
        // room has several, so they are measured against beds.
        List<UnitResidentDTO> payers = unitMemberFacade.getActiveResidentsByPropertyId(propertyId).stream()
                .filter(r -> r.role() == UnitMemberRole.TENANT || r.role() == UnitMemberRole.OWNER)
                .toList();
        int totalBeds = units.stream().mapToInt(u -> UnitOccupancy.beds(u.capacity())).sum();

        // Meters are read per unit, so a shared room needs one reading, not one per payer.
        Set<UUID> occupiedUnitIds = payers.stream().map(UnitResidentDTO::unitId).collect(Collectors.toSet());
        long meteredCharges = chargeConfigRepository.findAllByPropertyIdAndIsActiveTrue(propertyId).stream()
                .filter(c -> c.getCalculationStrategy() == CalculationStrategyType.METERED)
                .count();
        int readingsExpected = occupiedUnitIds.size() * (int) meteredCharges;
        int readingsEntered = (int) meterReadingRepository
                .findByPropertyIdAndBillingMonthAndBillingYear(propertyId, month.getMonthValue(), month.getYear()).stream()
                .filter(r -> occupiedUnitIds.contains(r.getUnitId()) && r.getCurrentReading() != null)
                .count();

        boolean isReady = readingsEntered >= readingsExpected || payers.isEmpty();
        return new BillDTOs.PreFlightChecklistResponse(
                units.size(), totalBeds, payers.size(), readingsExpected, readingsEntered, isReady);
    }

    @Override
    @Transactional
    public BillDTOs.BillResponse markPaid(UUID id) {
        BillTbl cycle = billRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Bill not found"));

        if (cycle.getStatus() == BillStatus.PAID) {
            return buildSingleResponse(cycle);
        }

        UUID confirmedBy = null;
        SecurityContext context = SecurityContextHolder.getContext();
        if (context != null && context.getAuthentication() != null && context.getAuthentication().getPrincipal() instanceof UserDetailsImpl principal) {
            confirmedBy = UUID.fromString(principal.getId());
        }
        if (confirmedBy == null) {
            confirmedBy = payerUserIdOf(cycle);
        }

        BigDecimal amountPaid = cycle.getAmountPaid() != null ? cycle.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal remainingAmount = cycle.getTotalAmount().subtract(amountPaid);

        recordCashPayment(id, remainingAmount, "Recorded via legacy markPaid", payerUserIdOf(cycle), confirmedBy);

        BillTbl updated = billRepository.findById(id).orElse(cycle);
        log.info("bill_marked_paid billId={} memberId={} paidAt={}",
                updated.getId(), updated.getMemberId(), updated.getPaidAt());
        return buildSingleResponse(updated);
    }

    @Override
    @Transactional
    public BillDTOs.BillResponse publish(UUID id) {
        BillTbl cycle = billRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Bill not found"));
        if (cycle.getStatus() == BillStatus.PENDING) {
            cycle.setStatus(BillStatus.PUBLISHED);
            billRepository.save(cycle);

            if (payerOf(cycle) != null && payerUnitIdOf(cycle) != null) {
                UUID unitId = payerUnitIdOf(cycle);
                UnitSummaryDTO u = unitFacade.getUnitById(unitId).orElse(null);
                UUID propertyId = u != null ? u.propertyId() : null;
                String billingMonth = cycle.getBillingMonth();

                List<BillingWorksheetEntryTbl> worksheets = propertyId == null ? List.of() :
                        billingWorksheetRepository.findAllByPropertyIdAndBillingMonth(propertyId, billingMonth);
                List<BillingWorksheetEntryTbl> unitWorksheets = worksheets.stream()
                        .filter(w -> w.getUnitId() != null && w.getUnitId().equals(unitId))
                        .peek(w -> w.setIsBilled(true))
                        .toList();
                if (!unitWorksheets.isEmpty()) {
                    billingWorksheetRepository.saveAll(unitWorksheets);
                }

                try {
                    String[] parts = billingMonth.split("-");
                    int year = Integer.parseInt(parts[0]);
                    int month = Integer.parseInt(parts[1]);
                    List<MeterReadingTbl> readings = propertyId == null ? List.of() :
                            meterReadingRepository.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, month, year);
                    List<MeterReadingTbl> unitReadings = readings.stream()
                            .filter(r -> r.getUnitId() != null && r.getUnitId().equals(unitId))
                            .peek(r -> r.setIsBilled(true))
                            .toList();
                    if (!unitReadings.isEmpty()) {
                        meterReadingRepository.saveAll(unitReadings);
                    }
                } catch (Exception e) {
                    log.warn("Failed to update meter readings for unit {}", unitId, e);
                }
            }

            eventPublisher.publishEvent(new RentPublishedEvent(
                    this,
                    cycle.getId(),
                    payerUserIdOf(cycle),
                    cycle.getBillingMonth(),
                    cycle.getTotalAmount(),
                    cycle.getDueDate()
            ));

            log.info("bill_published billId={} memberId={} billingMonth={}",
                    cycle.getId(), cycle.getMemberId(), cycle.getBillingMonth());
        }

        return buildSingleResponse(cycle);
    }

    @Override
    @Transactional
    public BillDTOs.BillResponse unpublish(UUID id) {
        BillTbl cycle = billRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Bill not found"));

        if (cycle.getStatus() == BillStatus.PUBLISHED) {
            cycle.setStatus(BillStatus.PENDING);
            billRepository.save(cycle);

            if (payerOf(cycle) != null && payerUnitIdOf(cycle) != null) {
                UUID unitId = payerUnitIdOf(cycle);
                UnitSummaryDTO u = unitFacade.getUnitById(unitId).orElse(null);
                UUID propertyId = u != null ? u.propertyId() : null;
                String billingMonth = cycle.getBillingMonth();

                List<BillingWorksheetEntryTbl> worksheets = propertyId == null ? List.of() :
                        billingWorksheetRepository.findAllByPropertyIdAndBillingMonth(propertyId, billingMonth);
                List<BillingWorksheetEntryTbl> unitWorksheets = worksheets.stream()
                        .filter(w -> w.getUnitId() != null && w.getUnitId().equals(unitId))
                        .peek(w -> w.setIsBilled(false))
                        .collect(Collectors.toList());
                if (!unitWorksheets.isEmpty()) {
                    billingWorksheetRepository.saveAll(unitWorksheets);
                }

                try {
                    String[] parts = billingMonth.split("-");
                    int year = Integer.parseInt(parts[0]);
                    int month = Integer.parseInt(parts[1]);
                    List<MeterReadingTbl> readings = propertyId == null ? List.of() :
                            meterReadingRepository.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, month, year);
                    List<MeterReadingTbl> unitReadings = readings.stream()
                            .filter(r -> r.getUnitId() != null && r.getUnitId().equals(unitId))
                            .peek(r -> r.setIsBilled(false))
                            .collect(Collectors.toList());
                    if (!unitReadings.isEmpty()) {
                        meterReadingRepository.saveAll(unitReadings);
                    }
                } catch (Exception e) {
                    log.warn("Failed to update meter readings for unit {}", unitId, e);
                }
            }

            log.info("bill_unpublished billId={} memberId={} billingMonth={}",
                    cycle.getId(), cycle.getMemberId(), cycle.getBillingMonth());
        }

        return buildSingleResponse(cycle);
    }

    @Override
    @Transactional
    public BillDTOs.BatchPublishResult batchPublish(UUID propertyId, String billingMonth) {
        List<UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        Map<UUID, String> unitNumbers = units.stream().collect(Collectors.toMap(UnitSummaryDTO::id, UnitSummaryDTO::unitNumber, (a, b) -> a));
        List<UUID> unitIds = units.stream().map(UnitSummaryDTO::id).toList();
        List<BillTbl> propertyCycles = billRepository.findByPropertyIdAndBillingMonth(propertyId, billingMonth);

        if (propertyId != null) {
            List<BillingWorksheetEntryTbl> worksheets = billingWorksheetRepository.findAllByPropertyIdAndBillingMonth(propertyId, billingMonth);
            List<BillingWorksheetEntryTbl> worksheetsToUpdate = worksheets.stream()
                    .peek(w -> w.setIsBilled(true))
                    .collect(Collectors.toList());
            if (!worksheetsToUpdate.isEmpty()) {
                billingWorksheetRepository.saveAll(worksheetsToUpdate);
            }

            try {
                String[] parts = billingMonth.split("-");
                int year = Integer.parseInt(parts[0]);
                int month = Integer.parseInt(parts[1]);
                List<MeterReadingTbl> readings = meterReadingRepository.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, month, year);
                List<MeterReadingTbl> readingsToUpdate = readings.stream()
                        .peek(r -> r.setIsBilled(true))
                        .collect(Collectors.toList());
                if (!readingsToUpdate.isEmpty()) {
                    meterReadingRepository.saveAll(readingsToUpdate);
                }
            } catch (Exception e) {
                log.warn("Failed to update meter readings for property {}", propertyId, e);
            }
        }

        // Deliberately not calling publish() per bill: it reloads the bill, re-resolves the
        // payer and re-scans the whole property's worksheets and meter readings every time.
        // The property-wide part is already done once above, so the loop only moves status.
        Map<UUID, UnitResidentDTO> payers = payersOf(propertyCycles);
        List<BillTbl> transitioned = new ArrayList<>();
        List<BillDTOs.BatchPublishFailure> failed = new ArrayList<>();

        for (BillTbl cycle : propertyCycles) {
            UnitResidentDTO payer = payers.get(cycle.getMemberId());
            String unitNum = payer != null ? unitNumbers.get(payer.unitId()) : null;
            try {
                if (cycle.getStatus() == BillStatus.PENDING) {
                    cycle.setStatus(BillStatus.PUBLISHED);
                    transitioned.add(cycle);
                }
            } catch (Exception e) {
                log.error("[BillServiceImpl] Failed to publish bill: {}, unit: {}", cycle.getId(), unitNum, e);
                failed.add(new BillDTOs.BatchPublishFailure(cycle.getId(), unitNum, e.getMessage()));
            }
        }

        if (!transitioned.isEmpty()) {
            billRepository.saveAll(transitioned);
        }
        for (BillTbl cycle : transitioned) {
            UnitResidentDTO payer = payers.get(cycle.getMemberId());
            eventPublisher.publishEvent(new RentPublishedEvent(
                    this,
                    cycle.getId(),
                    payer != null ? payer.userId() : null,
                    cycle.getBillingMonth(),
                    cycle.getTotalAmount(),
                    cycle.getDueDate()
            ));
        }

        List<BillDTOs.BillResponse> succeeded = new ArrayList<>(toResponses(propertyCycles));

        Comparator<BillDTOs.BillResponse> publishComp = Comparator.comparing(
                (BillDTOs.BillResponse r) -> r.unitNumber() != null ? r.unitNumber() : "",
                String.CASE_INSENSITIVE_ORDER
        ).thenComparing(
                (BillDTOs.BillResponse r) -> r.tenantName() != null ? r.tenantName() : "",
                String.CASE_INSENSITIVE_ORDER
        );
        succeeded.sort(publishComp);
        return new BillDTOs.BatchPublishResult(succeeded, failed);
    }

    @Override
    @Transactional
    public BillDTOs.BatchUnpublishResult batchUnpublish(UUID propertyId, String billingMonth) {
        List<UnitSummaryDTO> batchUnpublishUnits = unitFacade.getUnitsByPropertyId(propertyId);
        Map<UUID, String> unitNumbers = batchUnpublishUnits.stream().collect(Collectors.toMap(UnitSummaryDTO::id, UnitSummaryDTO::unitNumber, (a, b) -> a));
        List<UUID> unitIds = batchUnpublishUnits.stream().map(UnitSummaryDTO::id).toList();
        List<BillTbl> propertyCycles = billRepository.findByPropertyIdAndBillingMonth(propertyId, billingMonth);

        if (propertyId != null) {
            List<BillingWorksheetEntryTbl> worksheets = billingWorksheetRepository.findAllByPropertyIdAndBillingMonth(propertyId, billingMonth);
            List<BillingWorksheetEntryTbl> worksheetsToUpdate = worksheets.stream()
                    .peek(w -> w.setIsBilled(false))
                    .collect(Collectors.toList());
            if (!worksheetsToUpdate.isEmpty()) {
                billingWorksheetRepository.saveAll(worksheetsToUpdate);
            }

            try {
                String[] parts = billingMonth.split("-");
                int year = Integer.parseInt(parts[0]);
                int month = Integer.parseInt(parts[1]);
                List<MeterReadingTbl> readings = meterReadingRepository.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, month, year);
                List<MeterReadingTbl> readingsToUpdate = readings.stream()
                        .peek(r -> r.setIsBilled(false))
                        .collect(Collectors.toList());
                if (!readingsToUpdate.isEmpty()) {
                    meterReadingRepository.saveAll(readingsToUpdate);
                }
            } catch (Exception e) {
                log.warn("Failed to update meter readings for property {}", propertyId, e);
            }
        }

        // Same reasoning as batchPublish: the property-wide reset above happens once, and the
        // loop only moves status rather than re-running it per bill.
        Map<UUID, UnitResidentDTO> payers = payersOf(propertyCycles);
        List<BillTbl> transitioned = new ArrayList<>();
        List<BillDTOs.BatchUnpublishFailure> failed = new ArrayList<>();

        for (BillTbl cycle : propertyCycles) {
            UnitResidentDTO payer = payers.get(cycle.getMemberId());
            String unitNum = payer != null ? unitNumbers.get(payer.unitId()) : null;
            try {
                if (cycle.getStatus() == BillStatus.PUBLISHED) {
                    cycle.setStatus(BillStatus.PENDING);
                    transitioned.add(cycle);
                }
            } catch (Exception e) {
                log.error("[BillServiceImpl] Failed to unpublish bill: {}, unit: {}", cycle.getId(), unitNum, e);
                failed.add(new BillDTOs.BatchUnpublishFailure(cycle.getId(), unitNum, e.getMessage()));
            }
        }

        if (!transitioned.isEmpty()) {
            billRepository.saveAll(transitioned);
        }

        List<BillDTOs.BillResponse> succeeded = new ArrayList<>(toResponses(propertyCycles));

        Comparator<BillDTOs.BillResponse> unpublishComp = Comparator.comparing(
                (BillDTOs.BillResponse r) -> r.unitNumber() != null ? r.unitNumber() : "",
                String.CASE_INSENSITIVE_ORDER
        ).thenComparing(
                (BillDTOs.BillResponse r) -> r.tenantName() != null ? r.tenantName() : "",
                String.CASE_INSENSITIVE_ORDER
        );
        succeeded.sort(unpublishComp);
        return new BillDTOs.BatchUnpublishResult(succeeded, failed);
    }

    private BillDTOs.BillResponse buildSingleResponse(BillTbl bill) {
        UnitResidentDTO payer = payerOf(bill);

        UserSummaryDTO user = null;
        if (payer != null && payer.userId() != null) {
            user = userFacade.getUserById(payer.userId()).orElse(null);
        }

        UnitSummaryDTO unit = null;
        if (payer != null && payer.unitId() != null) {
            unit = unitFacade.getUnitById(payer.unitId()).orElse(null);
        }

        List<BillLineTbl> charges = bill.getId() != null ?
                billLineRepository.findByBill_Id(bill.getId()) : Collections.emptyList();

        return toResponse(bill, payer, user, unit, charges);
    }

    @Override
    public List<BillDTOs.BillResponse> toResponses(List<BillTbl> cycles) {
        if (cycles == null || cycles.isEmpty()) {
            return Collections.emptyList();
        }

        Map<UUID, UnitResidentDTO> payersByMemberId = payersOf(cycles);

        Set<UUID> userIds = payersByMemberId.values().stream()
                .map(UnitResidentDTO::userId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<UUID> billIds = cycles.stream()
                .filter(c -> c.getId() != null)
                .map(BillTbl::getId)
                .collect(Collectors.toSet());

        Map<UUID, UserSummaryDTO> usersMap = userIds.isEmpty() ? Collections.emptyMap() : userFacade.getUsersByIds(userIds);

        Map<UUID, List<BillLineTbl>> chargesMap = billIds.isEmpty() ? Collections.emptyMap() :
                billLineRepository.findByBill_IdIn(billIds)
                        .stream()
                        .filter(c -> c.getBill() != null && c.getBill().getId() != null)
                        .collect(Collectors.groupingBy(c -> c.getBill().getId()));

        Set<UUID> unitIds = payersByMemberId.values().stream()
                .map(UnitResidentDTO::unitId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, UnitSummaryDTO> unitsMap = unitFacade.getUnitsByIds(unitIds);

        return cycles.stream()
                .map(bill -> {
                    UnitResidentDTO payer = payersByMemberId.get(bill.getMemberId());
                    UserSummaryDTO user = payer != null ? usersMap.get(payer.userId()) : null;
                    UnitSummaryDTO unit = payer != null ? unitsMap.get(payer.unitId()) : null;
                    List<BillLineTbl> charges = chargesMap.getOrDefault(bill.getId(), Collections.emptyList());
                    return toResponse(bill, payer, user, unit, charges);
                })
                .toList();
    }

    private BillDTOs.BillResponse toResponse(BillTbl bill, UnitResidentDTO payer, UserSummaryDTO user,
                                             UnitSummaryDTO unit, List<BillLineTbl> charges) {
        String tenantName = (user != null && user.fullName() != null) ? user.fullName() : "Unknown Tenant";
        String unitNumber = (unit != null) ? unit.unitNumber() : "Vacant";
        UUID blockId = unit != null ? unit.blockId() : null;
        String blockName = unit != null ? unit.blockName() : null;
        return BillMapper.toResponse(bill, blockId, blockName, tenantName, unitNumber, charges);
    }

    /** The member who owes a bill, active or not — a bill outlives the tenancy behind it. */
    private UnitResidentDTO payerOf(BillTbl bill) {
        if (bill == null || bill.getMemberId() == null) {
            return null;
        }
        return unitMemberFacade.getResidentByMemberId(bill.getMemberId()).orElse(null);
    }

    /** The same in one query, keyed by member id, so list endpoints do not fan out per row. */
    private Map<UUID, UnitResidentDTO> payersOf(Collection<BillTbl> bills) {
        Set<UUID> memberIds = bills.stream()
                .map(BillTbl::getMemberId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (memberIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return unitMemberFacade.getResidentsByMemberIds(memberIds).stream()
                .collect(Collectors.toMap(UnitResidentDTO::memberId, Function.identity(), (a, b) -> a));
    }

    private UUID payerUserIdOf(BillTbl bill) {
        UnitResidentDTO payer = payerOf(bill);
        return payer != null ? payer.userId() : null;
    }

    private UUID payerUnitIdOf(BillTbl bill) {
        UnitResidentDTO payer = payerOf(bill);
        return payer != null ? payer.unitId() : null;
    }
}
