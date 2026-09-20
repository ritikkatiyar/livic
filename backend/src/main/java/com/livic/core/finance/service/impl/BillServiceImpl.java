package com.livic.core.finance.service.impl;

import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.common.domain.CalculationStrategyType;
import com.livic.platform.common.domain.LeaseStatus;
import com.livic.platform.common.event.RentPublishedEvent;
import com.livic.platform.common.exception.BusinessException;
import com.livic.core.finance.domain.BillingWorksheetEntryTbl;
import com.livic.core.finance.domain.ChargeConfigTbl;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.core.finance.domain.MeterReadingTbl;
import com.livic.core.finance.domain.BillLineTbl;
import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.core.finance.mapper.BillMapper;
import com.livic.core.finance.service.interfaces.BillingWorksheetCrudService;
import com.livic.core.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.verticals.rental.lease.service.interfaces.LeaseCrudService;
import com.livic.verticals.rental.lease.service.interfaces.LeaseQueryService;
import com.livic.core.finance.service.interfaces.MeterReadingCrudService;
import com.livic.core.finance.service.interfaces.BillLineCrudService;
import com.livic.core.finance.service.interfaces.BillCrudService;
import com.livic.core.finance.service.interfaces.BillService;
import com.livic.core.finance.specification.BillSpecifications;
import com.livic.platform.payment.dto.PaymentInitiationRequest;
import com.livic.platform.payment.dto.PaymentInitiationResponse;
import com.livic.platform.payment.facade.PaymentFacade;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.PropertyFacade;
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
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
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

    private final BillCrudService billCrudService;
    private final BillLineCrudService billLineCrudService;
    private final BillingWorksheetCrudService billingWorksheetCrudService;
    private final MeterReadingCrudService meterReadingCrudService;
    private final ChargeConfigCrudService chargeConfigCrudService;
    private final PaymentFacade paymentFacade;
    private final ApplicationEventPublisher eventPublisher;
    private final UserFacade userFacade;
    private final UnitFacade unitFacade;
    private final UnitMemberFacade unitMemberFacade;
    private final PropertyFacade propertyFacade;

    @Override
    @Transactional(readOnly = true)
    public BillDTOs.BillResponse getById(UUID id) {
        return buildSingleResponse(billCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Bill not found")));
    }

    @Override
    @Transactional
    public PaymentInitiationResponse initiateOnlinePayment(UUID billId, UUID payerUserId) {
        log.info("Executing initiateOnlinePayment for Bill: {} by user: {}", billId, payerUserId);
        BillTbl bill = billCrudService.findById(billId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));

        BigDecimal amountPaid = bill.getAmountPaid() != null ? bill.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal remainingAmount = bill.getTotalAmount().subtract(amountPaid);

        if (remainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Rent cycle is already fully paid");
        }

        PaymentInitiationRequest initRequest = PaymentInitiationRequest.builder()
                .payerUserId(payerUserId)
                .referenceType("BILL")
                .referenceId(billId)
                .amount(remainingAmount)
                .paymentMethod("ONLINE")
                .description("Rent Cycle Online Payment")
                .build();

        return paymentFacade.initiateOnlinePayment(initRequest);
    }

    @Override
    @Transactional
    public PaymentInitiationResponse recordCashPayment(UUID billId, BigDecimal amount, String note, UUID payerUserId, UUID confirmedBy) {
        log.info("Executing recordCashPayment for Bill: {} amount: {}", billId, amount);
        BillTbl bill = billCrudService.findById(billId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Valid positive amount is required");
        }

        UUID finalPayerId = payerUserId != null ? payerUserId : (payerOf(bill) != null ? payerUserIdOf(bill) : confirmedBy);

        PaymentInitiationRequest initRequest = PaymentInitiationRequest.builder()
                .payerUserId(finalPayerId)
                .referenceType("BILL")
                .referenceId(billId)
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
    public BillDTOs.BillListResponse list(UUID currentUserId, UUID propertyId, UUID leaseId, String billingMonth, BillStatus status, String search, Pageable pageable) {
        List<UUID> targetPropertyIds = new ArrayList<>();

        boolean isTenantView = false;
        if (currentUserId != null) {
            Optional<UnitResidentDTO> tenancyOpt = unitMemberFacade.getActiveResidencesByUserId(currentUserId).stream()
                    .filter(r -> r.role() == com.livic.core.property.domain.UnitMemberRole.TENANT)
                    .findFirst();
            if (tenancyOpt.isPresent()) {
                leaseId = tenancyOpt.get().leaseId();
                propertyId = null;
                isTenantView = true;
            } else {
                List<PropertySummaryDTO> userProperties = propertyFacade.getPropertiesByUserId(currentUserId);
                List<UUID> ownedPropertyIds = userProperties.stream().map(PropertySummaryDTO::id).toList();

                if (propertyId != null) {
                    if (!ownedPropertyIds.contains(propertyId)) {
                        return new BillDTOs.BillListResponse(
                                List.of(), 0, 0, pageable.getPageSize(), pageable.getPageNumber(),
                                new BillDTOs.RentRollMetricsDTO(BigDecimal.ZERO, 0L, 0L)
                        );
                    }
                    targetPropertyIds.add(propertyId);
                } else {
                    if (ownedPropertyIds.isEmpty()) {
                        return new BillDTOs.BillListResponse(
                                List.of(), 0, 0, pageable.getPageSize(), pageable.getPageNumber(),
                                new BillDTOs.RentRollMetricsDTO(BigDecimal.ZERO, 0L, 0L)
                        );
                    }
                    targetPropertyIds.addAll(ownedPropertyIds);
                }
            }
        } else if (propertyId != null) {
            targetPropertyIds.add(propertyId);
        }

        if (isTenantView && status == BillStatus.PENDING) {
            return new BillDTOs.BillListResponse(
                    List.of(), 0, 0, pageable.getPageSize(), pageable.getPageNumber(),
                    new BillDTOs.RentRollMetricsDTO(BigDecimal.ZERO, 0L, 0L)
            );
        }

        Specification<BillTbl> spec;
        if (leaseId != null) {
            spec = Specification.where(BillSpecifications.hasLeaseId(leaseId));
        } else {
            List<UUID> targetUnitIds = targetPropertyIds.isEmpty() ? List.of() :
                    unitFacade.getUnitsByPropertyIds(targetPropertyIds).stream().map(UnitSummaryDTO::id).toList();
            spec = Specification.where(BillSpecifications.hasUnitIdIn(targetUnitIds));
        }

        spec = spec.and(BillSpecifications.hasBillingMonth(billingMonth))
                .and(BillSpecifications.hasStatus(status));

        if (isTenantView && status == null) {
            spec = spec.and(BillSpecifications.hasStatusNot(BillStatus.PENDING));
        }

        if (search != null && !search.trim().isEmpty()) {
            List<UUID> matchingUnitIds = unitFacade.getUnitIdsByUnitNumberSearch(search);
            List<UUID> matchingUserIds = userFacade.getUserIdsBySearch(search);
            spec = spec.and(BillSpecifications.matchesSearch(matchingUnitIds, matchingUserIds));
        }

        Page<BillTbl> page = billCrudService.findAll(spec, pageable);
        List<BillDTOs.BillResponse> content = toResponses(page.getContent());

        BillDTOs.RentRollMetricsDTO rentRollMetrics = !targetPropertyIds.isEmpty() ?
                billCrudService.getRentRollMetricsForProperties(
                        targetPropertyIds,
                        billingMonth,
                        BillStatus.PENDING,
                        BillStatus.PUBLISHED,
                        BillStatus.PAID,
                        BillStatus.OVERDUE,
                        BillStatus.PARTIALLY_PAID
                ) : new BillDTOs.RentRollMetricsDTO(BigDecimal.ZERO, 0L, 0L);

        return new BillDTOs.BillListResponse(
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
    public BillDTOs.BillResponse markPaid(UUID id) {
        BillTbl cycle = billCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));

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

        BillTbl updated = billCrudService.findById(id).orElse(cycle);
        log.info("rent_cycle_marked_paid billId={} leaseId={} paidAt={}",
                updated.getId(), payerLeaseIdOf(updated), updated.getPaidAt());
        return buildSingleResponse(updated);
    }

    @Override
    @Transactional
    public BillDTOs.BillResponse publish(UUID id) {
        BillTbl cycle = billCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));
        if (cycle.getStatus() == BillStatus.PENDING) {
            cycle.setStatus(BillStatus.PUBLISHED);
            billCrudService.save(cycle);

            if (payerOf(cycle) != null && payerUnitIdOf(cycle) != null) {
                UUID unitId = payerUnitIdOf(cycle);
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
                    payerUserIdOf(cycle),
                    cycle.getBillingMonth(),
                    cycle.getTotalAmount(),
                    cycle.getDueDate()
            ));

            log.info("rent_cycle_published billId={} leaseId={} billingMonth={}",
                    cycle.getId(), payerLeaseIdOf(cycle), cycle.getBillingMonth());
        }

        return buildSingleResponse(cycle);
    }

    @Override
    @Transactional
    public BillDTOs.BillResponse unpublish(UUID id) {
        BillTbl cycle = billCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));

        if (cycle.getStatus() == BillStatus.PUBLISHED) {
            cycle.setStatus(BillStatus.PENDING);
            billCrudService.save(cycle);

            if (payerOf(cycle) != null && payerUnitIdOf(cycle) != null) {
                UUID unitId = payerUnitIdOf(cycle);
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

            log.info("rent_cycle_unpublished billId={} leaseId={} billingMonth={}",
                    cycle.getId(), payerLeaseIdOf(cycle), cycle.getBillingMonth());
        }

        return buildSingleResponse(cycle);
    }

    @Override
    public BillDTOs.BatchPublishResult batchPublish(UUID propertyId, String billingMonth) {
        List<UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        Map<UUID, String> unitNumbers = units.stream().collect(Collectors.toMap(UnitSummaryDTO::id, UnitSummaryDTO::unitNumber, (a, b) -> a));
        List<UUID> unitIds = units.stream().map(UnitSummaryDTO::id).toList();
        List<BillTbl> propertyCycles = billCrudService.findByPropertyIdAndBillingMonth(propertyId, billingMonth);

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

        List<BillDTOs.BillResponse> succeeded = new ArrayList<>();
        List<BillDTOs.BatchPublishFailure> failed = new ArrayList<>();

        for (BillTbl cycle : propertyCycles) {
            String unitNum = (payerOf(cycle) != null) ? unitNumbers.get(payerUnitIdOf(cycle)) : null;
            try {
                BillDTOs.BillResponse res = publish(cycle.getId());
                succeeded.add(res);
            } catch (Exception e) {
                log.error("[BillServiceImpl] Failed to publish rent cycle: {}, unit: {}", cycle.getId(), unitNum, e);
                failed.add(new BillDTOs.BatchPublishFailure(cycle.getId(), unitNum, e.getMessage()));
            }
        }

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
    public BillDTOs.BatchUnpublishResult batchUnpublish(UUID propertyId, String billingMonth) {
        List<UnitSummaryDTO> batchUnpublishUnits = unitFacade.getUnitsByPropertyId(propertyId);
        Map<UUID, String> unitNumbers = batchUnpublishUnits.stream().collect(Collectors.toMap(UnitSummaryDTO::id, UnitSummaryDTO::unitNumber, (a, b) -> a));
        List<UUID> unitIds = batchUnpublishUnits.stream().map(UnitSummaryDTO::id).toList();
        List<BillTbl> propertyCycles = billCrudService.findByPropertyIdAndBillingMonth(propertyId, billingMonth);

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

        List<BillDTOs.BillResponse> succeeded = new ArrayList<>();
        List<BillDTOs.BatchUnpublishFailure> failed = new ArrayList<>();

        for (BillTbl cycle : propertyCycles) {
            String unitNum = (payerOf(cycle) != null) ? unitNumbers.get(payerUnitIdOf(cycle)) : null;
            try {
                BillDTOs.BillResponse res = unpublish(cycle.getId());
                succeeded.add(res);
            } catch (Exception e) {
                log.error("[BillServiceImpl] Failed to unpublish rent cycle: {}, unit: {}", cycle.getId(), unitNum, e);
                failed.add(new BillDTOs.BatchUnpublishFailure(cycle.getId(), unitNum, e.getMessage()));
            }
        }

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
                billLineCrudService.findByBill_Id(bill.getId()) : Collections.emptyList();

        return toResponse(bill, payer, user, unit, charges);
    }

    private List<BillDTOs.BillResponse> toResponses(List<BillTbl> cycles) {
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
                billLineCrudService.findByBill_IdIn(billIds)
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
        UUID leaseId = payer != null ? payer.leaseId() : null;
        return BillMapper.toResponse(bill, leaseId, tenantName, unitNumber, charges);
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

    private UUID payerLeaseIdOf(BillTbl bill) {
        UnitResidentDTO payer = payerOf(bill);
        return payer != null ? payer.leaseId() : null;
    }
}
