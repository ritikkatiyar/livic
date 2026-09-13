package com.livic.services.finance.service.impl;

import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.common.domain.CalculationStrategyType;
import com.livic.platform.common.domain.LeaseStatus;
import com.livic.platform.common.event.RentPublishedEvent;
import com.livic.platform.common.exception.BusinessException;
import com.livic.services.finance.domain.BillingWorksheetEntryTbl;
import com.livic.services.finance.domain.ChargeConfigTbl;
import com.livic.services.finance.domain.LeaseTbl;
import com.livic.services.finance.domain.MeterReadingTbl;
import com.livic.services.finance.domain.RentCycleChargeTbl;
import com.livic.services.finance.domain.RentCycleStatus;
import com.livic.services.finance.domain.RentCycleTbl;
import com.livic.services.finance.dto.RentCycleDTOs;
import com.livic.services.finance.mapper.RentCycleMapper;
import com.livic.services.finance.service.interfaces.BillingWorksheetCrudService;
import com.livic.services.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.services.finance.service.interfaces.LeaseCrudService;
import com.livic.services.finance.service.interfaces.LeaseQueryService;
import com.livic.services.finance.service.interfaces.MeterReadingCrudService;
import com.livic.services.finance.service.interfaces.RentCycleChargeCrudService;
import com.livic.services.finance.service.interfaces.RentCycleCrudService;
import com.livic.services.finance.service.interfaces.RentCycleService;
import com.livic.services.finance.specification.RentCycleSpecifications;
import com.livic.platform.payment.dto.PaymentInitiationRequest;
import com.livic.platform.payment.dto.PaymentInitiationResponse;
import com.livic.platform.payment.facade.PaymentFacade;
import com.livic.services.property.dto.PropertySummaryDTO;
import com.livic.services.property.dto.UnitSummaryDTO;
import com.livic.services.property.facade.PropertyFacade;
import com.livic.services.property.facade.UnitFacade;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RentCycleServiceImpl implements RentCycleService {

    private final RentCycleCrudService rentCycleCrudService;
    private final RentCycleChargeCrudService rentCycleChargeCrudService;
    private final LeaseQueryService leaseQueryService;
    private final LeaseCrudService leaseCrudService;
    private final BillingWorksheetCrudService billingWorksheetCrudService;
    private final MeterReadingCrudService meterReadingCrudService;
    private final ChargeConfigCrudService chargeConfigCrudService;
    private final PaymentFacade paymentFacade;
    private final ApplicationEventPublisher eventPublisher;
    private final UserFacade userFacade;
    private final UnitFacade unitFacade;
    private final PropertyFacade propertyFacade;
    private final RentCycleTransactionHelper transactionHelper;

    @Override
    @Transactional
    public RentCycleDTOs.RentCycleResponse generate(RentCycleDTOs.GenerateRentCycleRequest request) {
        LeaseTbl lease = leaseQueryService.getLeaseById(request.leaseId());
        RentCycleTbl cycle = transactionHelper.generateSingleInTransaction(lease, request.billingMonth(), request.dueDate(), null);
        return buildSingleResponse(cycle);
    }

    @Override
    public RentCycleDTOs.BatchGenerateResult batchGenerate(RentCycleDTOs.BatchGenerateRentCycleRequest request) {
        List<UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(request.propertyId());
        Map<UUID, String> unitNumbers = units.stream().collect(Collectors.toMap(UnitSummaryDTO::id, UnitSummaryDTO::unitNumber, (a, b) -> a));
        List<UUID> unitIds = units.stream().map(UnitSummaryDTO::id).toList();
        List<LeaseTbl> activeLeases = unitIds.isEmpty() ? List.of() :
                leaseCrudService.findByUnitIdInAndStatus(unitIds, LeaseStatus.ACTIVE);

        Map<UUID, Integer> roommateCounts = activeLeases.stream()
                .collect(Collectors.groupingBy(LeaseTbl::getUnitId, Collectors.collectingAndThen(Collectors.toList(), List::size)));

        List<BillingWorksheetEntryTbl> propertyWorksheets = billingWorksheetCrudService.findAllByPropertyIdAndBillingMonth(request.propertyId(), request.billingMonth());
        List<ChargeConfigTbl> propertyActiveConfigs = chargeConfigCrudService.findAllByPropertyIdAndIsActiveTrue(request.propertyId());

        List<RentCycleTbl> successes = new ArrayList<>();
        List<RentCycleDTOs.BatchGenerateFailure> failures = new ArrayList<>();

        for (LeaseTbl lease : activeLeases) {
            String unitNum = unitNumbers.get(lease.getUnitId());
            try {
                RentCycleTbl cycle = transactionHelper.generateSingleInTransaction(
                        lease,
                        request.billingMonth(),
                        request.dueDate(),
                        roommateCounts,
                        propertyWorksheets,
                        propertyActiveConfigs,
                        unitNumbers
                );
                successes.add(cycle);
            } catch (Exception e) {
                log.error("[RentCycleServiceImpl] Failed to generate rent cycle for lease ID: {}, unit: {}", lease.getId(), unitNum, e);
                failures.add(new RentCycleDTOs.BatchGenerateFailure(lease.getId(), unitNum, e.getMessage()));
            }
        }

        List<RentCycleDTOs.RentCycleResponse> succeededResponses = new ArrayList<>(toResponses(successes));
        succeededResponses.sort(Comparator.comparing(RentCycleDTOs.RentCycleResponse::unitNumber)
                .thenComparing(RentCycleDTOs.RentCycleResponse::tenantName));
        return new RentCycleDTOs.BatchGenerateResult(succeededResponses, failures);
    }

    @Override
    @Transactional(readOnly = true)
    public RentCycleDTOs.PreFlightChecklistResponse getPreFlightChecklist(UUID propertyId, String billingMonth) {
        List<UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        List<UUID> unitIds = units.stream().map(UnitSummaryDTO::id).toList();
        List<LeaseTbl> activeLeases = unitIds.isEmpty() ? List.of() :
                leaseCrudService.findByUnitIdInAndStatus(unitIds, LeaseStatus.ACTIVE);
        int totalUnits = units.size();
        int activeLeasesCount = activeLeases.size();

        long meteredTypesCount = chargeConfigCrudService.findAllByPropertyIdAndIsActiveTrue(propertyId).stream()
                .filter(c -> c.getCalculationStrategy() == CalculationStrategyType.METERED)
                .count();

        int meterReadingsExpected = activeLeasesCount * (int) meteredTypesCount;
        int meterReadingsEntered = 0;

        try {
            String[] parts = billingMonth.split("-");
            int year = Integer.parseInt(parts[0]);
            int month = Integer.parseInt(parts[1]);

            List<MeterReadingTbl> propertyReadings = meterReadingCrudService.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, month, year);
            Map<UUID, List<MeterReadingTbl>> readingsByUnit = propertyReadings.stream()
                    .collect(Collectors.groupingBy(MeterReadingTbl::getUnitId));

            for (LeaseTbl lease : activeLeases) {
                List<MeterReadingTbl> readings = readingsByUnit.getOrDefault(lease.getUnitId(), List.of());
                long enteredForLease = readings.stream().filter(r -> r.getCurrentReading() != null).count();
                meterReadingsEntered += enteredForLease;
            }
        } catch (Exception e) {
            log.warn("Failed to calculate meter readings for checklist", e);
        }

        boolean isReady = (meterReadingsEntered >= meterReadingsExpected) || activeLeasesCount == 0;
        return new RentCycleDTOs.PreFlightChecklistResponse(
            totalUnits,
            activeLeasesCount,
            meterReadingsExpected,
            meterReadingsEntered,
            isReady
        );
    }

    @Override
    @Transactional
    public PaymentInitiationResponse initiateOnlinePayment(UUID rentCycleId, UUID payerUserId) {
        log.info("Executing initiateOnlinePayment for RentCycle: {} by user: {}", rentCycleId, payerUserId);
        RentCycleTbl rentCycle = rentCycleCrudService.findById(rentCycleId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));

        BigDecimal amountPaid = rentCycle.getAmountPaid() != null ? rentCycle.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal remainingAmount = rentCycle.getTotalAmount().subtract(amountPaid);

        if (remainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Rent cycle is already fully paid");
        }

        PaymentInitiationRequest initRequest = PaymentInitiationRequest.builder()
                .payerUserId(payerUserId)
                .referenceType("RENT_CYCLE")
                .referenceId(rentCycleId)
                .amount(remainingAmount)
                .paymentMethod("ONLINE")
                .description("Rent Cycle Online Payment")
                .build();

        return paymentFacade.initiateOnlinePayment(initRequest);
    }

    @Override
    @Transactional
    public PaymentInitiationResponse recordCashPayment(UUID rentCycleId, BigDecimal amount, String note, UUID payerUserId, UUID confirmedBy) {
        log.info("Executing recordCashPayment for RentCycle: {} amount: {}", rentCycleId, amount);
        RentCycleTbl rentCycle = rentCycleCrudService.findById(rentCycleId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Valid positive amount is required");
        }

        UUID finalPayerId = payerUserId != null ? payerUserId : (rentCycle.getLease() != null ? rentCycle.getLease().getUserId() : confirmedBy);

        PaymentInitiationRequest initRequest = PaymentInitiationRequest.builder()
                .payerUserId(finalPayerId)
                .referenceType("RENT_CYCLE")
                .referenceId(rentCycleId)
                .amount(amount)
                .paymentMethod("CASH")
                .confirmedBy(confirmedBy)
                .note(note)
                .description("Rent Cycle Cash Payment")
                .build();

        return paymentFacade.recordCashPayment(initRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public RentCycleDTOs.RentCycleListResponse list(UUID currentUserId, UUID propertyId, UUID leaseId, String billingMonth, RentCycleStatus status, String search, Pageable pageable) {
        List<UUID> targetPropertyIds = new ArrayList<>();

        boolean isTenantView = false;
        if (currentUserId != null) {
            Optional<LeaseTbl> tenantLeaseOpt = leaseQueryService.findByUserIdAndStatus(currentUserId, LeaseStatus.ACTIVE);
            if (tenantLeaseOpt.isPresent()) {
                leaseId = tenantLeaseOpt.get().getId();
                propertyId = null;
                isTenantView = true;
            } else {
                List<PropertySummaryDTO> userProperties = propertyFacade.getPropertiesByUserId(currentUserId);
                List<UUID> ownedPropertyIds = userProperties.stream().map(PropertySummaryDTO::id).toList();

                if (propertyId != null) {
                    if (!ownedPropertyIds.contains(propertyId)) {
                        return new RentCycleDTOs.RentCycleListResponse(
                                List.of(), 0, 0, pageable.getPageSize(), pageable.getPageNumber(),
                                new RentCycleDTOs.RentRollMetricsDTO(BigDecimal.ZERO, 0L, 0L)
                        );
                    }
                    targetPropertyIds.add(propertyId);
                } else {
                    if (ownedPropertyIds.isEmpty()) {
                        return new RentCycleDTOs.RentCycleListResponse(
                                List.of(), 0, 0, pageable.getPageSize(), pageable.getPageNumber(),
                                new RentCycleDTOs.RentRollMetricsDTO(BigDecimal.ZERO, 0L, 0L)
                        );
                    }
                    targetPropertyIds.addAll(ownedPropertyIds);
                }
            }
        } else if (propertyId != null) {
            targetPropertyIds.add(propertyId);
        }

        if (isTenantView && status == RentCycleStatus.PENDING) {
            return new RentCycleDTOs.RentCycleListResponse(
                    List.of(), 0, 0, pageable.getPageSize(), pageable.getPageNumber(),
                    new RentCycleDTOs.RentRollMetricsDTO(BigDecimal.ZERO, 0L, 0L)
            );
        }

        Specification<RentCycleTbl> spec;
        if (leaseId != null) {
            spec = Specification.where(RentCycleSpecifications.hasLeaseId(leaseId));
        } else {
            List<UUID> targetUnitIds = targetPropertyIds.isEmpty() ? List.of() :
                    unitFacade.getUnitsByPropertyIds(targetPropertyIds).stream().map(UnitSummaryDTO::id).toList();
            spec = Specification.where(RentCycleSpecifications.hasUnitIdIn(targetUnitIds));
        }

        spec = spec.and(RentCycleSpecifications.hasBillingMonth(billingMonth))
                .and(RentCycleSpecifications.hasStatus(status));

        if (isTenantView && status == null) {
            spec = spec.and(RentCycleSpecifications.hasStatusNot(RentCycleStatus.PENDING));
        }

        if (search != null && !search.trim().isEmpty()) {
            List<UUID> matchingUnitIds = unitFacade.getUnitIdsByUnitNumberSearch(search);
            List<UUID> matchingUserIds = userFacade.getUserIdsBySearch(search);
            spec = spec.and(RentCycleSpecifications.matchesSearch(matchingUnitIds, matchingUserIds));
        }

        Page<RentCycleTbl> page = rentCycleCrudService.findAll(spec, pageable);
        List<RentCycleDTOs.RentCycleResponse> content = toResponses(page.getContent());

        RentCycleDTOs.RentRollMetricsDTO rentRollMetrics = !targetPropertyIds.isEmpty() ?
                rentCycleCrudService.getRentRollMetricsForProperties(
                        targetPropertyIds,
                        billingMonth,
                        RentCycleStatus.PENDING,
                        RentCycleStatus.PUBLISHED,
                        RentCycleStatus.PAID,
                        RentCycleStatus.OVERDUE,
                        RentCycleStatus.PARTIALLY_PAID
                ) : new RentCycleDTOs.RentRollMetricsDTO(BigDecimal.ZERO, 0L, 0L);

        return new RentCycleDTOs.RentCycleListResponse(
                content,
                page.getTotalElements(),
                page.getTotalPages(),
                page.getSize(),
                page.getNumber(),
                rentRollMetrics
        );
    }

    @Override
    @Transactional
    public RentCycleDTOs.RentCycleResponse markPaid(UUID id) {
        RentCycleTbl cycle = rentCycleCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));

        if (cycle.getStatus() == RentCycleStatus.PAID) {
            return buildSingleResponse(cycle);
        }

        UUID confirmedBy = null;
        SecurityContext context = SecurityContextHolder.getContext();
        if (context != null && context.getAuthentication() != null && context.getAuthentication().getPrincipal() instanceof UserDetailsImpl principal) {
            confirmedBy = UUID.fromString(principal.getId());
        }
        if (confirmedBy == null) {
            confirmedBy = cycle.getLease().getUserId();
        }

        BigDecimal amountPaid = cycle.getAmountPaid() != null ? cycle.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal remainingAmount = cycle.getTotalAmount().subtract(amountPaid);

        recordCashPayment(id, remainingAmount, "Recorded via legacy markPaid", cycle.getLease().getUserId(), confirmedBy);

        RentCycleTbl updated = rentCycleCrudService.findById(id).orElse(cycle);
        log.info("rent_cycle_marked_paid rentCycleId={} leaseId={} paidAt={}",
                updated.getId(), updated.getLease().getId(), updated.getPaidAt());
        return buildSingleResponse(updated);
    }

    @Override
    @Transactional
    public RentCycleDTOs.RentCycleResponse publish(UUID id) {
        RentCycleTbl cycle = rentCycleCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));
        if (cycle.getStatus() == RentCycleStatus.PENDING) {
            cycle.setStatus(RentCycleStatus.PUBLISHED);
            rentCycleCrudService.save(cycle);

            if (cycle.getLease() != null && cycle.getLease().getUnitId() != null) {
                UUID unitId = cycle.getLease().getUnitId();
                UnitSummaryDTO u = unitFacade.getUnitById(unitId).orElse(null);
                UUID propertyId = u != null ? u.propertyId() : null;
                String billingMonth = cycle.getBillingMonth();

                List<BillingWorksheetEntryTbl> worksheets = propertyId == null ? List.of() :
                        billingWorksheetCrudService.findAllByPropertyIdAndBillingMonth(propertyId, billingMonth);
                List<BillingWorksheetEntryTbl> unitWorksheets = worksheets.stream()
                        .filter(w -> w.getUnitId() != null && w.getUnitId().equals(unitId))
                        .peek(w -> w.setIsBilled(true))
                        .toList();
                if (!unitWorksheets.isEmpty()) {
                    billingWorksheetCrudService.saveAll(unitWorksheets);
                }

                try {
                    String[] parts = billingMonth.split("-");
                    int year = Integer.parseInt(parts[0]);
                    int month = Integer.parseInt(parts[1]);
                    List<MeterReadingTbl> readings = propertyId == null ? List.of() :
                            meterReadingCrudService.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, month, year);
                    List<MeterReadingTbl> unitReadings = readings.stream()
                            .filter(r -> r.getUnitId() != null && r.getUnitId().equals(unitId))
                            .peek(r -> r.setIsBilled(true))
                            .toList();
                    if (!unitReadings.isEmpty()) {
                        meterReadingCrudService.saveAll(unitReadings);
                    }
                } catch (Exception e) {
                    log.warn("Failed to update meter readings for unit {}", unitId, e);
                }
            }

            eventPublisher.publishEvent(new RentPublishedEvent(
                    this,
                    cycle.getId(),
                    cycle.getLease().getUserId(),
                    cycle.getBillingMonth(),
                    cycle.getTotalAmount(),
                    cycle.getDueDate()
            ));

            log.info("rent_cycle_published rentCycleId={} leaseId={} billingMonth={}",
                    cycle.getId(), cycle.getLease().getId(), cycle.getBillingMonth());
        }

        return buildSingleResponse(cycle);
    }

    @Override
    @Transactional
    public RentCycleDTOs.RentCycleResponse unpublish(UUID id) {
        RentCycleTbl cycle = rentCycleCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));

        if (cycle.getStatus() == RentCycleStatus.PUBLISHED) {
            cycle.setStatus(RentCycleStatus.PENDING);
            rentCycleCrudService.save(cycle);

            if (cycle.getLease() != null && cycle.getLease().getUnitId() != null) {
                UUID unitId = cycle.getLease().getUnitId();
                UnitSummaryDTO u = unitFacade.getUnitById(unitId).orElse(null);
                UUID propertyId = u != null ? u.propertyId() : null;
                String billingMonth = cycle.getBillingMonth();

                List<BillingWorksheetEntryTbl> worksheets = propertyId == null ? List.of() :
                        billingWorksheetCrudService.findAllByPropertyIdAndBillingMonth(propertyId, billingMonth);
                List<BillingWorksheetEntryTbl> unitWorksheets = worksheets.stream()
                        .filter(w -> w.getUnitId() != null && w.getUnitId().equals(unitId))
                        .peek(w -> w.setIsBilled(false))
                        .collect(Collectors.toList());
                if (!unitWorksheets.isEmpty()) {
                    billingWorksheetCrudService.saveAll(unitWorksheets);
                }

                try {
                    String[] parts = billingMonth.split("-");
                    int year = Integer.parseInt(parts[0]);
                    int month = Integer.parseInt(parts[1]);
                    List<MeterReadingTbl> readings = propertyId == null ? List.of() :
                            meterReadingCrudService.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, month, year);
                    List<MeterReadingTbl> unitReadings = readings.stream()
                            .filter(r -> r.getUnitId() != null && r.getUnitId().equals(unitId))
                            .peek(r -> r.setIsBilled(false))
                            .collect(Collectors.toList());
                    if (!unitReadings.isEmpty()) {
                        meterReadingCrudService.saveAll(unitReadings);
                    }
                } catch (Exception e) {
                    log.warn("Failed to update meter readings for unit {}", unitId, e);
                }
            }

            log.info("rent_cycle_unpublished rentCycleId={} leaseId={} billingMonth={}",
                    cycle.getId(), cycle.getLease() != null ? cycle.getLease().getId() : null, cycle.getBillingMonth());
        }

        return buildSingleResponse(cycle);
    }

    @Override
    public RentCycleDTOs.BatchPublishResult batchPublish(UUID propertyId, String billingMonth) {
        List<UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        Map<UUID, String> unitNumbers = units.stream().collect(Collectors.toMap(UnitSummaryDTO::id, UnitSummaryDTO::unitNumber, (a, b) -> a));
        List<UUID> unitIds = units.stream().map(UnitSummaryDTO::id).toList();
        List<LeaseTbl> activeLeases = unitIds.isEmpty() ? List.of() :
                leaseCrudService.findByUnitIdInAndStatus(unitIds, LeaseStatus.ACTIVE);
        List<UUID> activeLeaseIds = activeLeases.stream().map(LeaseTbl::getId).toList();

        List<RentCycleTbl> propertyCycles = activeLeaseIds.isEmpty() ? List.of() :
                rentCycleCrudService.findByLease_IdInAndBillingMonth(activeLeaseIds, billingMonth);

        if (propertyId != null) {
            List<BillingWorksheetEntryTbl> worksheets = billingWorksheetCrudService.findAllByPropertyIdAndBillingMonth(propertyId, billingMonth);
            List<BillingWorksheetEntryTbl> worksheetsToUpdate = worksheets.stream()
                    .peek(w -> w.setIsBilled(true))
                    .collect(Collectors.toList());
            if (!worksheetsToUpdate.isEmpty()) {
                billingWorksheetCrudService.saveAll(worksheetsToUpdate);
            }

            try {
                String[] parts = billingMonth.split("-");
                int year = Integer.parseInt(parts[0]);
                int month = Integer.parseInt(parts[1]);
                List<MeterReadingTbl> readings = meterReadingCrudService.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, month, year);
                List<MeterReadingTbl> readingsToUpdate = readings.stream()
                        .peek(r -> r.setIsBilled(true))
                        .collect(Collectors.toList());
                if (!readingsToUpdate.isEmpty()) {
                    meterReadingCrudService.saveAll(readingsToUpdate);
                }
            } catch (Exception e) {
                log.warn("Failed to update meter readings for property {}", propertyId, e);
            }
        }

        List<RentCycleDTOs.RentCycleResponse> succeeded = new ArrayList<>();
        List<RentCycleDTOs.BatchPublishFailure> failed = new ArrayList<>();

        for (RentCycleTbl cycle : propertyCycles) {
            String unitNum = (cycle.getLease() != null) ? unitNumbers.get(cycle.getLease().getUnitId()) : null;
            try {
                RentCycleDTOs.RentCycleResponse res = transactionHelper.publishSingleInTransaction(cycle.getId());
                succeeded.add(res);
            } catch (Exception e) {
                log.error("[RentCycleServiceImpl] Failed to publish rent cycle: {}, unit: {}", cycle.getId(), unitNum, e);
                failed.add(new RentCycleDTOs.BatchPublishFailure(cycle.getId(), unitNum, e.getMessage()));
            }
        }

        Comparator<RentCycleDTOs.RentCycleResponse> publishComp = Comparator.comparing(
                (RentCycleDTOs.RentCycleResponse r) -> r.unitNumber() != null ? r.unitNumber() : "",
                String.CASE_INSENSITIVE_ORDER
        ).thenComparing(
                (RentCycleDTOs.RentCycleResponse r) -> r.tenantName() != null ? r.tenantName() : "",
                String.CASE_INSENSITIVE_ORDER
        );
        succeeded.sort(publishComp);
        return new RentCycleDTOs.BatchPublishResult(succeeded, failed);
    }

    @Override
    public RentCycleDTOs.BatchUnpublishResult batchUnpublish(UUID propertyId, String billingMonth) {
        List<UnitSummaryDTO> batchUnpublishUnits = unitFacade.getUnitsByPropertyId(propertyId);
        Map<UUID, String> unitNumbers = batchUnpublishUnits.stream().collect(Collectors.toMap(UnitSummaryDTO::id, UnitSummaryDTO::unitNumber, (a, b) -> a));
        List<UUID> unitIds = batchUnpublishUnits.stream().map(UnitSummaryDTO::id).toList();
        List<LeaseTbl> activeLeases = unitIds.isEmpty() ? List.of() :
                leaseCrudService.findByUnitIdInAndStatus(unitIds, LeaseStatus.ACTIVE);
        List<UUID> activeLeaseIds = activeLeases.stream().map(LeaseTbl::getId).toList();

        List<RentCycleTbl> propertyCycles = activeLeaseIds.isEmpty() ? List.of() :
                rentCycleCrudService.findByLease_IdInAndBillingMonth(activeLeaseIds, billingMonth);

        if (propertyId != null) {
            List<BillingWorksheetEntryTbl> worksheets = billingWorksheetCrudService.findAllByPropertyIdAndBillingMonth(propertyId, billingMonth);
            List<BillingWorksheetEntryTbl> worksheetsToUpdate = worksheets.stream()
                    .peek(w -> w.setIsBilled(false))
                    .collect(Collectors.toList());
            if (!worksheetsToUpdate.isEmpty()) {
                billingWorksheetCrudService.saveAll(worksheetsToUpdate);
            }

            try {
                String[] parts = billingMonth.split("-");
                int year = Integer.parseInt(parts[0]);
                int month = Integer.parseInt(parts[1]);
                List<MeterReadingTbl> readings = meterReadingCrudService.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, month, year);
                List<MeterReadingTbl> readingsToUpdate = readings.stream()
                        .peek(r -> r.setIsBilled(false))
                        .collect(Collectors.toList());
                if (!readingsToUpdate.isEmpty()) {
                    meterReadingCrudService.saveAll(readingsToUpdate);
                }
            } catch (Exception e) {
                log.warn("Failed to update meter readings for property {}", propertyId, e);
            }
        }

        List<RentCycleDTOs.RentCycleResponse> succeeded = new ArrayList<>();
        List<RentCycleDTOs.BatchUnpublishFailure> failed = new ArrayList<>();

        for (RentCycleTbl cycle : propertyCycles) {
            String unitNum = (cycle.getLease() != null) ? unitNumbers.get(cycle.getLease().getUnitId()) : null;
            try {
                RentCycleDTOs.RentCycleResponse res = transactionHelper.unpublishSingleInTransaction(cycle.getId());
                succeeded.add(res);
            } catch (Exception e) {
                log.error("[RentCycleServiceImpl] Failed to unpublish rent cycle: {}, unit: {}", cycle.getId(), unitNum, e);
                failed.add(new RentCycleDTOs.BatchUnpublishFailure(cycle.getId(), unitNum, e.getMessage()));
            }
        }

        Comparator<RentCycleDTOs.RentCycleResponse> unpublishComp = Comparator.comparing(
                (RentCycleDTOs.RentCycleResponse r) -> r.unitNumber() != null ? r.unitNumber() : "",
                String.CASE_INSENSITIVE_ORDER
        ).thenComparing(
                (RentCycleDTOs.RentCycleResponse r) -> r.tenantName() != null ? r.tenantName() : "",
                String.CASE_INSENSITIVE_ORDER
        );
        succeeded.sort(unpublishComp);
        return new RentCycleDTOs.BatchUnpublishResult(succeeded, failed);
    }

    private RentCycleDTOs.RentCycleResponse buildSingleResponse(RentCycleTbl cycle) {
        UserSummaryDTO user = null;
        if (cycle.getLease() != null && cycle.getLease().getUserId() != null) {
            user = userFacade.getUserById(cycle.getLease().getUserId()).orElse(null);
        }

        UnitSummaryDTO unit = null;
        if (cycle.getLease() != null && cycle.getLease().getUnitId() != null) {
            unit = unitFacade.getUnitById(cycle.getLease().getUnitId()).orElse(null);
        }

        List<RentCycleChargeTbl> charges = cycle.getId() != null ?
                rentCycleChargeCrudService.findByRentCycle_Id(cycle.getId()) : Collections.emptyList();

        return toResponse(cycle, user, unit, charges);
    }

    private List<RentCycleDTOs.RentCycleResponse> toResponses(List<RentCycleTbl> cycles) {
        if (cycles == null || cycles.isEmpty()) {
            return Collections.emptyList();
        }

        Set<UUID> userIds = cycles.stream()
                .filter(c -> c.getLease() != null && c.getLease().getUserId() != null)
                .map(c -> c.getLease().getUserId())
                .collect(Collectors.toSet());

        Set<UUID> rentCycleIds = cycles.stream()
                .filter(c -> c.getId() != null)
                .map(RentCycleTbl::getId)
                .collect(Collectors.toSet());

        Map<UUID, UserSummaryDTO> usersMap = userIds.isEmpty() ? Collections.emptyMap() : userFacade.getUsersByIds(userIds);

        Map<UUID, List<RentCycleChargeTbl>> chargesMap = rentCycleIds.isEmpty() ? Collections.emptyMap() :
                rentCycleChargeCrudService.findByRentCycle_IdIn(rentCycleIds)
                        .stream()
                        .filter(c -> c.getRentCycle() != null && c.getRentCycle().getId() != null)
                        .collect(Collectors.groupingBy(c -> c.getRentCycle().getId()));

        Set<UUID> unitIds = cycles.stream()
                .filter(c -> c.getLease() != null && c.getLease().getUnitId() != null)
                .map(c -> c.getLease().getUnitId())
                .collect(Collectors.toSet());

        Map<UUID, UnitSummaryDTO> unitsMap = unitFacade.getUnitsByIds(unitIds);

        return cycles.stream()
                .map(cycle -> {
                    UserSummaryDTO user = cycle.getLease() != null ? usersMap.get(cycle.getLease().getUserId()) : null;
                    UnitSummaryDTO unit = cycle.getLease() != null ? unitsMap.get(cycle.getLease().getUnitId()) : null;
                    List<RentCycleChargeTbl> charges = chargesMap.getOrDefault(cycle.getId(), Collections.emptyList());
                    return toResponse(cycle, user, unit, charges);
                })
                .toList();
    }

    private RentCycleDTOs.RentCycleResponse toResponse(RentCycleTbl cycle, UserSummaryDTO user, UnitSummaryDTO unit, List<RentCycleChargeTbl> charges) {
        String tenantName = (user != null && user.fullName() != null) ? user.fullName() : "Unknown Tenant";
        String unitNumber = (unit != null) ? unit.unitNumber() : "Vacant";
        return RentCycleMapper.toResponse(cycle, tenantName, unitNumber, charges);
    }
}
