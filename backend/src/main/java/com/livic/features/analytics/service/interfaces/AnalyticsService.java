package com.livic.features.analytics.service.interfaces;

import com.livic.features.analytics.dto.DefaulterResponse;
import com.livic.features.analytics.dto.ExpensesBreakdownResponse;
import com.livic.features.analytics.dto.PortfolioOccupancyResponse;
import com.livic.features.analytics.dto.SummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AnalyticsService {

    SummaryResponse getSummary(UUID landlordId, String billingMonth);

    Page<PortfolioOccupancyResponse> getOccupancy(UUID landlordId, Pageable pageable);

    Page<DefaulterResponse> getDefaulters(UUID landlordId, Pageable pageable);

    ExpensesBreakdownResponse getExpensesBreakdown(UUID landlordId, String billingMonth);
}
