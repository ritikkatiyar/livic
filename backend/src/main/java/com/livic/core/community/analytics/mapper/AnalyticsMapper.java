package com.livic.core.community.analytics.mapper;

import com.livic.core.community.analytics.dto.DefaulterResponse;
import com.livic.core.community.analytics.dto.ExpensesBreakdownResponse;
import com.livic.core.community.analytics.dto.PortfolioOccupancyResponse;
import com.livic.core.community.analytics.dto.SummaryResponse;
import com.livic.core.finance.facade.FinanceFacade.DefaulterRecordDTO;
import com.livic.core.finance.facade.FinanceFacade.RevenueMetricsDTO;
import com.livic.core.property.facade.PropertyFacade.PropertyOccupancySummaryDTO;
import com.livic.platform.user.dto.UserSummaryDTO;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Map;

public final class AnalyticsMapper {

    private AnalyticsMapper() {}

    public static SummaryResponse toSummaryResponse(RevenueMetricsDTO rev, BigDecimal totalExpenses) {
        BigDecimal expected = rev.expected();
        BigDecimal collected = rev.collected();
        BigDecimal collectionRate = expected.compareTo(BigDecimal.ZERO) > 0
                ? collected.divide(expected, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;
        BigDecimal netProfit = collected.subtract(totalExpenses);

        return new SummaryResponse(
                expected,
                collected,
                collectionRate,
                totalExpenses,
                BigDecimal.ZERO,
                netProfit,
                BigDecimal.ZERO
        );
    }

    public static SummaryResponse emptySummaryResponse() {
        return new SummaryResponse(
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
        );
    }

    public static PortfolioOccupancyResponse toPortfolioOccupancyResponse(PropertyOccupancySummaryDTO row) {
        BigDecimal occRate = percent(row.occupiedUnits(), row.totalUnits());
        BigDecimal netYield = occRate.multiply(BigDecimal.valueOf(0.08));

        return new PortfolioOccupancyResponse(
                row.propertyId().toString(), row.propertyName(),
                row.totalUnits(), row.occupiedUnits(), occRate, netYield,
                row.vacantUnits(), row.partialUnits(), row.fullUnits(),
                row.totalBeds(), row.occupiedBeds(), percent(row.occupiedBeds(), row.totalBeds()),
                row.activeLeases()
        );
    }

    private static BigDecimal percent(int part, int whole) {
        return whole > 0
                ? BigDecimal.valueOf(part).divide(BigDecimal.valueOf(whole), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;
    }

    public static DefaulterResponse toDefaulterResponse(DefaulterRecordDTO row, UserSummaryDTO user, LocalDate today) {
        String tenantName = (user != null && user.fullName() != null) ? user.fullName() : "Unknown";
        long daysOverdue = row.dueDate().until(today).getDays();
        if (daysOverdue < 0) {
            daysOverdue = 0;
        }

        return new DefaulterResponse(
                tenantName,
                row.unitNumber(),
                row.propertyName(),
                row.blockId(),
                row.blockName(),
                (int) daysOverdue,
                row.amountDue(),
                row.billId()
        );
    }

    public static ExpensesBreakdownResponse toExpensesBreakdownResponse(BigDecimal totalExpenses, Map<String, BigDecimal> overhead) {
        return new ExpensesBreakdownResponse(totalExpenses, BigDecimal.ZERO, overhead);
    }

    public static ExpensesBreakdownResponse emptyExpensesBreakdownResponse() {
        return new ExpensesBreakdownResponse(BigDecimal.ZERO, BigDecimal.ZERO, Map.of());
    }
}
