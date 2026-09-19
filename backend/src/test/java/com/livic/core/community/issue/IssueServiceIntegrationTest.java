package com.livic.core.community.issue;

import com.livic.platform.auth.facade.AuthFacade;
import com.livic.platform.subscription.SubscriptionTestSupport;
import com.livic.platform.subscription.repository.SaasSubscriptionRepository;
import com.livic.platform.subscription.repository.SubscriptionPlanRepository;
import com.livic.platform.common.exception.BusinessException;
import com.livic.core.finance.domain.LeaseTbl;
import com.livic.core.finance.repository.LeaseRepository;
import com.livic.core.community.issue.domain.IssueCategory;
import com.livic.core.community.issue.domain.IssueEscalationStatus;
import com.livic.core.community.issue.domain.IssuePriority;
import com.livic.core.community.issue.domain.IssueScope;
import com.livic.core.community.issue.domain.IssueStatus;
import com.livic.core.community.issue.domain.IssueTbl;
import com.livic.core.community.issue.dto.IssueDTOs.CreateCommentRequest;
import com.livic.core.community.issue.dto.IssueDTOs.CreateIssueRequest;
import com.livic.core.community.issue.dto.IssueDTOs.IssueResponse;
import com.livic.core.community.issue.dto.IssueDTOs.UpdateStatusRequest;
import com.livic.core.community.issue.service.interfaces.IssueCrudService;
import com.livic.core.community.issue.service.interfaces.IssueService;
import com.livic.core.property.domain.PropertyTbl;
import com.livic.core.property.domain.UnitTbl;
import com.livic.core.property.repository.PropertyRepository;
import com.livic.core.property.repository.UnitRepository;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class IssueServiceIntegrationTest {

    @Autowired
    private IssueService issueService;

    @Autowired
    private com.livic.core.property.service.interfaces.UnitMemberService unitMemberService;

    @Autowired
    private com.livic.core.property.service.interfaces.BlockService blockService;

    @Autowired
    private IssueCrudService issueCrudService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private LeaseRepository leaseRepository;

    @Autowired
    private AuthFacade authFacade;

    @Autowired
    private SaasSubscriptionRepository subscriptionRepository;

    @Autowired
    private SubscriptionPlanRepository planRepository;

    private UserTbl landlord;
    private UserTbl caretaker;
    private UserTbl tenant;
    private UserTbl unauthorizedTenant;
    private PropertyTbl property;
    private UnitTbl unit;
    private LeaseTbl lease;

    @BeforeEach
    public void setUp() {
        landlord = UserTbl.builder()
                .authUid("landlord@test.com")
                .fullName("Landlord User")
                .phoneNumber("1234567890")
                .failedLoginAttempts(0)
                .build();
        userRepository.save(landlord);

        caretaker = UserTbl.builder()
                .authUid("caretaker@test.com")
                .fullName("Caretaker User")
                .phoneNumber("1234567891")
                .failedLoginAttempts(0)
                .build();
        userRepository.save(caretaker);

        tenant = UserTbl.builder()
                .authUid("tenant@test.com")
                .fullName("Tenant User")
                .phoneNumber("1234567892")
                .failedLoginAttempts(0)
                .build();
        userRepository.save(tenant);

        unauthorizedTenant = UserTbl.builder()
                .authUid("unauth@test.com")
                .fullName("Unauthorized Tenant")
                .phoneNumber("1234567893")
                .failedLoginAttempts(0)
                .build();
        userRepository.save(unauthorizedTenant);

        property = PropertyTbl.builder()
                .name("Greenfield Heights")
                .address("Sector 45")
                .city("Gurugram")
                .build();
        propertyRepository.save(property);

        unit = UnitTbl.builder()
                .property(property)
                .block(blockService.getOrCreateDefaultBlock(property))
                .unitNumber("101")
                .floor(1)
                .capacity(2)
                .gridX(0)
                .gridY(0)
                .type(com.livic.platform.common.domain.UnitType.ONE_BHK)
                .build();
        unitRepository.save(unit);

        lease = LeaseTbl.builder()
                .userId(tenant.getId())
                .unitId(unit.getId())
                .moveInDate(LocalDate.now().minusMonths(1))
                .moveOutDate(LocalDate.now().plusMonths(11))
                .monthlyRentAmount(BigDecimal.valueOf(15000))
                .securityDeposit(BigDecimal.valueOf(30000))
                .status(com.livic.platform.common.domain.LeaseStatus.ACTIVE)
                .splitStrategy(com.livic.platform.common.domain.LeaseSplitStrategy.FULL_UNIT)
                .build();
        leaseRepository.save(lease);
        // The lease is saved directly here, so add the unit member the lease service would create.
        unitMemberService.addTenant(unit.getId(), tenant.getId(), lease.getId(), lease.getMoveInDate(), null);

        SubscriptionTestSupport.subscribe(subscriptionRepository, planRepository, landlord.getId(), SubscriptionTestSupport.ENTERPRISE_PLAN_ID);
        // Seed property memberships
        authFacade.createOwnerMembership(property.getId(), landlord.getId());
        authFacade.createMembership(
                property.getId(),
                caretaker.getId(),
                "Caretaker",
                com.livic.platform.common.enums.AccessType.CUSTOM_ACCESS,
                java.util.Set.of("PROPERTY_VIEW", "ANNOUNCEMENT_CREATE", "ISSUE_VIEW", "ISSUE_MANAGE"),
                landlord.getId()
        );
    }

    @Test
    public void testCommonAreaIssuePermissions() {
        // 1. Caretaker can create and view COMMON_AREA issue (no lease_id)
        CreateIssueRequest caretakerRequest = new CreateIssueRequest(
                property.getId(),
                null,
                null,
                null,
                "Clogged Common Drainage",
                "Main lobby drainage is blocked.",
                IssueCategory.MAINTENANCE,
                IssuePriority.STANDARD,
                IssueScope.COMMON_AREA,
                "Security Guard",
                "+911234567890"
        );

        IssueResponse caretakerIssue = issueService.createIssue(caretakerRequest, caretaker.getId());
        assertNotNull(caretakerIssue);
        assertEquals("Clogged Common Drainage", caretakerIssue.title());
        assertEquals(IssueScope.COMMON_AREA, caretakerIssue.scope());

        // 2. Tenant cannot create COMMON_AREA issue (should be rejected/scoped to their lease/unit)
        CreateIssueRequest tenantRequest = new CreateIssueRequest(
                property.getId(),
                null,
                null,
                null,
                "Tenant Common area complain",
                "Parking light is broken.",
                IssueCategory.MAINTENANCE,
                IssuePriority.STANDARD,
                IssueScope.COMMON_AREA,
                "Tenant User",
                null
        );

        IssueResponse tenantIssue = issueService.createIssue(tenantRequest, tenant.getId());
        assertEquals(IssueScope.UNIT, tenantIssue.scope());
        assertEquals(lease.getId(), tenantIssue.leaseId());
        assertEquals(unit.getId(), tenantIssue.unitId());
    }

    @Test
    public void testSafetyEmergencyImmediateEscalation() {
        CreateIssueRequest request = new CreateIssueRequest(
                property.getId(),
                unit.getId(),
                lease.getId(),
                tenant.getId(),
                "Gas Leak in Apartment",
                "Strong smell of LPG gas in the kitchen.",
                IssueCategory.SAFETY,
                IssuePriority.URGENT,
                IssueScope.UNIT,
                "Tenant User",
                null
        );

        IssueResponse response = issueService.createIssue(request, tenant.getId());
        assertNotNull(response);
        assertEquals(IssueEscalationStatus.ESCALATED, response.escalationStatus());
        assertEquals(1, response.escalationLevel());
        assertEquals(1, response.timeline().size());
        assertEquals("Safety emergency automatically escalated immediately on creation.", response.timeline().get(0).content());
    }

    @Test
    public void testSlaAutoEscalationStrategyTrigger() {
        CreateIssueRequest request = new CreateIssueRequest(
                property.getId(),
                unit.getId(),
                lease.getId(),
                tenant.getId(),
                "AC Compressor Not Working",
                "High priority maintenance needed for AC.",
                IssueCategory.MAINTENANCE,
                IssuePriority.HIGH,
                IssueScope.UNIT,
                "Tenant User",
                null
        );

        IssueResponse response = issueService.createIssue(request, tenant.getId());
        assertNotNull(response);
        assertEquals(IssueEscalationStatus.NONE, response.escalationStatus());

        // Manually adjust the creation date to 50 hours ago to simulate SLA breach
        IssueTbl issue = issueCrudService.findById(response.id()).orElseThrow();
        issue.setCreatedAt(LocalDateTime.now().minusHours(50));
        issueCrudService.save(issue);

        // Execute daily cron SLA evaluation job
        issueService.runDailyEscalationJob();

        // Verify issue was auto-escalated
        IssueResponse updated = issueService.getIssue(response.id(), tenant.getId());
        assertEquals(IssueEscalationStatus.ESCALATED, updated.escalationStatus());
        assertEquals(1, updated.escalationLevel());
        assertTrue(updated.timeline().size() > 0);
    }

    @Test
    public void testCommentsAndStatusTimelineAuditing() {
        CreateIssueRequest request = new CreateIssueRequest(
                property.getId(),
                unit.getId(),
                lease.getId(),
                tenant.getId(),
                "Kitchen Faucet Leaking",
                "Water dripping slowly from faucet.",
                IssueCategory.MAINTENANCE,
                IssuePriority.LOW,
                IssueScope.UNIT,
                "Tenant User",
                null
        );

        IssueResponse issue = issueService.createIssue(request, tenant.getId());
        assertEquals(0, issue.timeline().size());

        // 1. Add Comment
        issue = issueService.addComment(issue.id(), "Plumber scheduled for tomorrow morning.", landlord.getId());
        assertEquals(1, issue.timeline().size());
        assertEquals("Plumber scheduled for tomorrow morning.", issue.timeline().get(0).content());

        // 2. Change Status
        UpdateStatusRequest statusRequest = new UpdateStatusRequest(IssueStatus.IN_PROGRESS, "Work initiated.");
        issue = issueService.updateStatus(issue.id(), statusRequest, landlord.getId());
        assertEquals(2, issue.timeline().size());
        assertTrue(issue.timeline().get(1).content().contains("Status changed from OPEN to IN_PROGRESS"));
    }
}
