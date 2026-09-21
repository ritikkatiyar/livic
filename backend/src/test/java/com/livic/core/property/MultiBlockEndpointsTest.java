package com.livic.core.property;

import com.livic.core.community.analytics.controller.AnalyticsController;
import com.livic.core.community.analytics.dto.DefaulterResponse;
import com.livic.core.community.analytics.service.interfaces.AnalyticsService;
import com.livic.core.community.issue.controller.IssueController;
import com.livic.core.community.issue.dto.IssueDTOs.IssueResponse;
import com.livic.core.community.issue.service.interfaces.IssueService;
import com.livic.core.finance.controller.MeterReadingController;
import com.livic.core.finance.dto.MeterReadingDTOs.MeterReadingResponse;
import com.livic.core.finance.service.MeterReadingService;
import com.livic.platform.common.domain.UserRole;
import com.livic.platform.common.response.ApiResponse;
import com.livic.platform.security.UserDetailsImpl;
import com.livic.verticals.rental.lease.controller.LeaseController;
import com.livic.verticals.rental.lease.dto.LeaseDTOs.LeaseResponse;
import com.livic.verticals.rental.lease.service.interfaces.LeaseOrchestrationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MultiBlockEndpointsTest {

    @Mock
    private LeaseOrchestrationService leaseOrchestrationService;

    @Mock
    private MeterReadingService meterReadingService;

    @Mock
    private IssueService issueService;

    @Mock
    private AnalyticsService analyticsService;

    private LeaseController leaseController;
    private MeterReadingController meterReadingController;
    private IssueController issueController;
    private AnalyticsController analyticsController;

    private UserDetailsImpl currentUser;
    private UUID userId;
    private UUID propertyId;
    private UUID blockId;

    @BeforeEach
    void setUp() {
        leaseController = new LeaseController(leaseOrchestrationService);
        meterReadingController = new MeterReadingController(meterReadingService);
        issueController = new IssueController(issueService);
        analyticsController = new AnalyticsController(analyticsService);

        userId = UUID.randomUUID();
        propertyId = UUID.randomUUID();
        blockId = UUID.randomUUID();
        currentUser = UserDetailsImpl.fromClaims(userId.toString(), "test-auth", UserRole.USER.name());
    }

    @Test
    @DisplayName("LeaseController.getActiveLeasesByProperty passes blockId to service")
    void testGetActiveLeasesByPropertyWithBlockId() {
        Pageable pageable = PageRequest.of(0, 10);
        LeaseResponse lease = Mockito.mock(LeaseResponse.class);
        when(lease.blockId()).thenReturn(blockId);
        when(lease.blockName()).thenReturn("Tower A");

        Page<LeaseResponse> page = new PageImpl<>(List.of(lease));

        when(leaseOrchestrationService.getActiveLeasesByProperty(userId, propertyId, blockId, pageable))
                .thenReturn(page);

        ResponseEntity<ApiResponse<Page<LeaseResponse>>> response =
                leaseController.getActiveLeasesByProperty(currentUser, propertyId, blockId, pageable);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getData().getContent().size());
        assertEquals(blockId, response.getBody().getData().getContent().get(0).blockId());
        assertEquals("Tower A", response.getBody().getData().getContent().get(0).blockName());

        verify(leaseOrchestrationService).getActiveLeasesByProperty(userId, propertyId, blockId, pageable);
    }

    @Test
    @DisplayName("MeterReadingController.getWorksheet passes blockId to service")
    void testGetWorksheetWithBlockId() {
        UUID chargeConfigId = UUID.randomUUID();
        MeterReadingResponse reading = new MeterReadingResponse();
        reading.setBlockId(blockId);
        reading.setBlockName("Tower B");
        reading.setFloor(2);
        reading.setPreviousReading(BigDecimal.valueOf(100));
        reading.setCurrentReading(BigDecimal.valueOf(150));

        when(meterReadingService.getOrCreateWorksheet(propertyId, chargeConfigId, blockId, 9, 2026))
                .thenReturn(List.of(reading));

        ResponseEntity<ApiResponse<List<MeterReadingResponse>>> response =
                meterReadingController.getWorksheet(propertyId, chargeConfigId, blockId, 9, 2026);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getData().size());
        assertEquals(blockId, response.getBody().getData().get(0).getBlockId());
        assertEquals("Tower B", response.getBody().getData().get(0).getBlockName());

        verify(meterReadingService).getOrCreateWorksheet(propertyId, chargeConfigId, blockId, 9, 2026);
    }

    @Test
    @DisplayName("IssueController.listIssues passes blockId to service")
    void testListIssuesWithBlockId() {
        Pageable pageable = PageRequest.of(0, 10);
        IssueResponse issue = Mockito.mock(IssueResponse.class);
        when(issue.blockId()).thenReturn(blockId);
        when(issue.blockName()).thenReturn("Tower C");

        Page<IssueResponse> page = new PageImpl<>(List.of(issue));

        when(issueService.listIssues(userId, blockId, pageable))
                .thenReturn(page);

        ResponseEntity<ApiResponse<Page<IssueResponse>>> response =
                issueController.listIssues(currentUser, blockId, pageable);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getData().getContent().size());
        assertEquals(blockId, response.getBody().getData().getContent().get(0).blockId());
        assertEquals("Tower C", response.getBody().getData().getContent().get(0).blockName());

        verify(issueService).listIssues(userId, blockId, pageable);
    }

    @Test
    @DisplayName("AnalyticsController.getDefaulters returns blockId and blockName in DefaulterResponse")
    void testGetDefaultersWithBlockMetadata() {
        Pageable pageable = PageRequest.of(0, 10);
        DefaulterResponse defaulter = new DefaulterResponse(
                "John Doe",
                "404",
                "Sunset Apartments",
                blockId,
                "Tower D",
                15,
                BigDecimal.valueOf(15000),
                UUID.randomUUID()
        );
        Page<DefaulterResponse> page = new PageImpl<>(List.of(defaulter));

        when(analyticsService.getDefaulters(userId, pageable))
                .thenReturn(page);

        ResponseEntity<ApiResponse<Page<DefaulterResponse>>> response =
                analyticsController.getDefaulters(currentUser, pageable);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getData().getContent().size());
        DefaulterResponse item = response.getBody().getData().getContent().get(0);
        assertEquals(blockId, item.blockId());
        assertEquals("Tower D", item.blockName());

        verify(analyticsService).getDefaulters(userId, pageable);
    }
}
