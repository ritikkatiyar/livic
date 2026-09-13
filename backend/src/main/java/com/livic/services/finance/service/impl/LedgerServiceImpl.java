package com.livic.services.finance.service.impl;

import com.livic.services.finance.domain.FinanceLedgerTbl;
import com.livic.services.finance.domain.LeaseTbl;
import com.livic.services.finance.dto.LedgerDTOs.LedgerEntryResponse;
import com.livic.services.finance.service.interfaces.FinanceLedgerCrudService;
import com.livic.services.finance.specification.FinanceLedgerSpecifications;
import com.livic.services.finance.service.interfaces.LedgerService;
import com.livic.services.property.dto.UnitSummaryDTO;
import com.livic.services.property.facade.UnitFacade;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LedgerServiceImpl implements LedgerService {

    private final FinanceLedgerCrudService financeLedgerCrudService;
    private final UserFacade userFacade;
    private final UnitFacade unitFacade;

    @Override
    @Transactional(readOnly = true)
    public Page<LedgerEntryResponse> getLedgerForProperty(UUID propertyId, String search, LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable) {
        Specification<FinanceLedgerTbl> spec = Specification
                .where(FinanceLedgerSpecifications.hasPropertyId(propertyId))
                .and(FinanceLedgerSpecifications.createdAfter(fromDate))
                .and(FinanceLedgerSpecifications.createdBefore(toDate))
                .and(FinanceLedgerSpecifications.searchStringFields(search));

        Page<FinanceLedgerTbl> entriesPage = financeLedgerCrudService.findAll(spec, pageable);

        // Fetch units for mapping unit names
        List<UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        Map<UUID, UnitSummaryDTO> unitMap = units.stream()
                .collect(Collectors.toMap(UnitSummaryDTO::id, u -> u));

        // Batch fetch tenant users to avoid N+1 query
        Set<UUID> userIds = entriesPage.getContent().stream()
                .map(FinanceLedgerTbl::getLease)
                .filter(Objects::nonNull)
                .map(LeaseTbl::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, UserSummaryDTO> usersMap = userIds.isEmpty() ? Collections.emptyMap() : userFacade.getUsersByIds(userIds);

        // Batch fetch running balances to avoid N+1 query
        List<UUID> entryIds = entriesPage.getContent().stream()
                .map(FinanceLedgerTbl::getId)
                .collect(Collectors.toList());

        Map<UUID, BigDecimal> runningBalancesMap = Collections.emptyMap();
        if (!entryIds.isEmpty()) {
            runningBalancesMap = financeLedgerCrudService.getRunningBalancesForEntries(entryIds).stream()
                    .filter(row -> row[0] != null)
                    .collect(Collectors.toMap(
                            row -> toUuid(row[0]),
                            row -> toBigDecimal(row[1]),
                            (existing, replacement) -> existing
                    ));
        }

        final Map<UUID, BigDecimal> finalRunningBalancesMap = runningBalancesMap;

        return entriesPage.map(entry -> {
            String tenantName = "N/A";
            LeaseTbl lease = entry.getLease();
            if (lease != null && lease.getUserId() != null) {
                UserSummaryDTO tenant = usersMap.get(lease.getUserId());
                if (tenant != null) {
                    tenantName = tenant.fullName();
                } else {
                    log.warn("Tenant user not found for lease userId: {}", lease.getUserId());
                }
            }

            // Compute running cumulative balance for this lease at this entry
            BigDecimal runningBalance = entry.getAmount();
            if (lease != null) {
                BigDecimal balance = finalRunningBalancesMap.get(entry.getId());
                if (balance != null) {
                    runningBalance = balance;
                }
            }

            String unitName = "N/A";
            if (entry.getUnitId() != null) {
                UnitSummaryDTO u = unitMap.get(entry.getUnitId());
                if (u != null) {
                    unitName = "Apt " + u.unitNumber();
                }
            }

            return LedgerEntryResponse.builder()
                    .id(entry.getId())
                    .unitName(unitName)
                    .tenantName(tenantName)
                    .transactionType(entry.getTransactionType())
                    .amount(entry.getAmount())
                    .balance(runningBalance)
                    .referenceId(entry.getReferenceId())
                    .description(entry.getDescription())
                    .createdAt(entry.getCreatedAt())
                    .build();
        });
    }

    private UUID toUuid(Object obj) {
        if (obj instanceof UUID) {
            return (UUID) obj;
        }
        return UUID.fromString(obj.toString());
    }

    private BigDecimal toBigDecimal(Object obj) {
        if (obj == null) {
            return BigDecimal.ZERO;
        }
        if (obj instanceof BigDecimal) {
            return (BigDecimal) obj;
        }
        if (obj instanceof Number) {
            return BigDecimal.valueOf(((Number) obj).doubleValue());
        }
        return new BigDecimal(obj.toString());
    }
}
