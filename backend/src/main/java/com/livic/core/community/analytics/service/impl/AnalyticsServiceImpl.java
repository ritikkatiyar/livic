package com.livic.core.community.analytics.service.impl;

import com.livic.core.community.analytics.dto.DefaulterResponse;
import com.livic.core.community.analytics.dto.ExpensesBreakdownResponse;
import com.livic.core.community.analytics.dto.PortfolioOccupancyResponse;
import com.livic.core.community.analytics.dto.SummaryResponse;
import com.livic.core.community.analytics.mapper.AnalyticsMapper;
import com.livic.core.community.analytics.service.interfaces.AnalyticsService;
import com.livic.platform.auth.facade.AuthFacade;
import com.livic.platform.common.constant.StaffPermission;
import com.livic.core.finance.facade.FinanceFacade;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.livic.core.finance.facade.FinanceFacade.DefaulterRecordDTO;
import static com.livic.core.finance.facade.FinanceFacade.RevenueMetricsDTO;
import static com.livic.core.property.facade.PropertyFacade.PropertyOccupancySummaryDTO;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private final FinanceFacade financeFacade;
    private final PropertyFacade propertyFacade;
    private final UserFacade userFacade;
    private final AuthFacade authFacade;

    private List<UUID> getLandlordPropertyIds(UUID landlordId) {
        return authFacade.getEffectivePermissionCodes(landlordId).entrySet().stream()
                .filter(e -> e.getValue().contains(StaffPermission.ANALYTICS_VIEW.name()))
                .map(Map.Entry::getKey)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private String resolveBillingMonth(String billingMonth) {
        if (billingMonth != null && !billingMonth.isBlank()) {
            return billingMonth;
        }
        LocalDate now = LocalDate.now();
        return String.format("%d-%02d", now.getYear(), now.getMonthValue());
    }

    @Override
    public SummaryResponse getSummary(UUID landlordId, String billingMonth) {
        List<UUID> propertyIds = getLandlordPropertyIds(landlordId);
        if (propertyIds.isEmpty()) {
            return AnalyticsMapper.emptySummaryResponse();
        }

        String month = resolveBillingMonth(billingMonth);
        RevenueMetricsDTO rev = financeFacade.getRevenueMetrics(propertyIds, month);
        BigDecimal totalExpenses = financeFacade.getTotalExpenses(propertyIds);

        return AnalyticsMapper.toSummaryResponse(rev, totalExpenses);
    }

    @Override
    public Page<PortfolioOccupancyResponse> getOccupancy(UUID landlordId, Pageable pageable) {
        List<UUID> propertyIds = getLandlordPropertyIds(landlordId);
        if (propertyIds.isEmpty()) {
            return Page.empty(pageable);
        }

        List<PropertyOccupancySummaryDTO> occupancyData = propertyFacade.getOccupancyByProperty(propertyIds);
        List<PortfolioOccupancyResponse> all = occupancyData.stream()
                .map(AnalyticsMapper::toPortfolioOccupancyResponse)
                .toList();

        return paginateList(all, pageable);
    }

    @Override
    public Page<DefaulterResponse> getDefaulters(UUID landlordId, Pageable pageable) {
        List<UUID> propertyIds = getLandlordPropertyIds(landlordId);
        if (propertyIds.isEmpty()) {
            return Page.empty(pageable);
        }

        List<DefaulterRecordDTO> defaulterData = financeFacade.getDefaulters(propertyIds);
        LocalDate today = LocalDate.now();

        List<UUID> tenantIds = defaulterData.stream()
                .map(DefaulterRecordDTO::tenantId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<UUID, UserSummaryDTO> usersMap = userFacade.getUsersByIds(tenantIds);

        List<DefaulterResponse> all = new ArrayList<>();
        for (DefaulterRecordDTO row : defaulterData) {
            UserSummaryDTO user = row.tenantId() != null ? usersMap.get(row.tenantId()) : null;
            all.add(AnalyticsMapper.toDefaulterResponse(row, user, today));
        }

        return paginateList(all, pageable);
    }

    @Override
    public ExpensesBreakdownResponse getExpensesBreakdown(UUID landlordId, String billingMonth) {
        List<UUID> propertyIds = getLandlordPropertyIds(landlordId);
        if (propertyIds.isEmpty()) {
            return AnalyticsMapper.emptyExpensesBreakdownResponse();
        }

        BigDecimal totalExpenses = financeFacade.getTotalExpenses(propertyIds);
        Map<String, BigDecimal> overhead = financeFacade.getOperationalOverhead(propertyIds);

        return AnalyticsMapper.toExpensesBreakdownResponse(totalExpenses, overhead);
    }

    private <T> Page<T> paginateList(List<T> list, Pageable pageable) {
        int start = (int) pageable.getOffset();
        if (start >= list.size()) {
            return new PageImpl<>(List.of(), pageable, list.size());
        }
        int end = Math.min(start + pageable.getPageSize(), list.size());
        return new PageImpl<>(list.subList(start, end), pageable, list.size());
    }
}
