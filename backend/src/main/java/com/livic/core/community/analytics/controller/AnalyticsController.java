package com.livic.core.community.analytics.controller;

import com.livic.core.community.analytics.dto.DefaulterResponse;
import com.livic.core.community.analytics.dto.ExpensesBreakdownResponse;
import com.livic.core.community.analytics.dto.PortfolioOccupancyResponse;
import com.livic.core.community.analytics.dto.SummaryResponse;
import com.livic.core.community.analytics.service.interfaces.AnalyticsService;
import com.livic.platform.security.UserDetailsImpl;
import com.livic.platform.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<SummaryResponse>> getSummary(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) String billingMonth
    ) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getSummary(getUserId(currentUser), billingMonth)));
    }

    @GetMapping("/occupancy")
    public ResponseEntity<ApiResponse<Page<PortfolioOccupancyResponse>>> getOccupancy(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getOccupancy(getUserId(currentUser), pageable)));
    }

    @GetMapping("/defaulters")
    public ResponseEntity<ApiResponse<Page<DefaulterResponse>>> getDefaulters(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getDefaulters(getUserId(currentUser), pageable)));
    }

    @GetMapping("/expenses-breakdown")
    public ResponseEntity<ApiResponse<ExpensesBreakdownResponse>> getExpensesBreakdown(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) String billingMonth
    ) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getExpensesBreakdown(getUserId(currentUser), billingMonth)));
    }

    private UUID getUserId(UserDetailsImpl user) {
        return UUID.fromString(user.getId());
    }
}
