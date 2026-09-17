package com.livic.verticals.marketplace;

import com.livic.verticals.marketplace.domain.MarketplaceLeadTbl;
import com.livic.verticals.marketplace.repository.MarketplaceLeadRepository;
import com.livic.verticals.marketplace.service.impl.TourRequestNotificationServiceImpl;
import com.livic.verticals.marketplace.service.interfaces.TourAvailabilityService;
import com.livic.verticals.marketplace.slots.TourSchedule;
import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.domain.LeadType;
import com.livic.platform.notification.domain.MessageTemplate;
import com.livic.platform.notification.dto.TemplatedMessage;
import com.livic.platform.notification.service.SmsService;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.facade.PropertyFacade;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TourRequestNotificationServiceTest {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final String PHONE = "9876543210";

    @Mock private MarketplaceLeadRepository leadRepository;
    @Mock private PropertyFacade propertyFacade;
    @Mock private TourAvailabilityService tourAvailabilityService;
    @Mock private SmsService smsService;
    @InjectMocks private TourRequestNotificationServiceImpl service;

    private final UUID propertyId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "marketplaceBaseUrl", "https://livic.in");
        lenient().when(propertyFacade.getPropertyById(propertyId)).thenReturn(Optional.of(
                new PropertySummaryDTO(propertyId, "Test Residency", "12 MG Road", "Pune", null, 3, true)));
        lenient().when(tourAvailabilityService.getSchedule(propertyId)).thenReturn(TourSchedule.defaults(List.of()));
        lenient().when(smsService.sendToPhone(eq(PHONE), any(TemplatedMessage.class))).thenReturn(true);
    }

    @Test
    @DisplayName("Approval SMS shows the visit in the property timezone with the first name and My Requests link")
    void approvalMessage() {
        // 2026-09-17 05:30 UTC is 11:00 AM in India
        MarketplaceLeadTbl lead = tour(LeadStatus.APPROVED, LocalDateTime.of(2026, 9, 17, 11, 0).atZone(IST).toInstant());
        when(leadRepository.findById(lead.getId())).thenReturn(Optional.of(lead));

        service.notifyDecision(lead.getId());

        TemplatedMessage message = sentMessage();
        assertEquals(MessageTemplate.TOUR_APPROVED, message.template());
        assertEquals(Map.of(
                "name", "Jane",
                "property", "Test Residency",
                "date", "Thu, 17 Sep",
                "time", "11:00 AM",
                "link", "https://livic.in/market-place/my-requests"), message.variables());
    }

    @Test
    @DisplayName("Decline SMS carries the landlord note, or a fixed phrase when there is none")
    void declineMessage() {
        Instant visit = LocalDateTime.of(2026, 9, 17, 16, 30).atZone(IST).toInstant();
        MarketplaceLeadTbl withNote = tour(LeadStatus.REJECTED, visit);
        withNote.setDecisionNote("Fully booked that day");
        MarketplaceLeadTbl withoutNote = tour(LeadStatus.REJECTED, visit);
        when(leadRepository.findById(withNote.getId())).thenReturn(Optional.of(withNote));
        when(leadRepository.findById(withoutNote.getId())).thenReturn(Optional.of(withoutNote));

        service.notifyDecision(withNote.getId());
        service.notifyDecision(withoutNote.getId());

        ArgumentCaptor<TemplatedMessage> captor = ArgumentCaptor.forClass(TemplatedMessage.class);
        verify(smsService, times(2)).sendToPhone(eq(PHONE), captor.capture());
        assertEquals(MessageTemplate.TOUR_DECLINED, captor.getAllValues().get(0).template());
        assertEquals("4:30 PM", captor.getAllValues().get(0).variables().get("time"));
        assertEquals("Fully booked that day", captor.getAllValues().get(0).variables().get("note"));
        assertEquals("The slot isn't available.", captor.getAllValues().get(1).variables().get("note"));
    }

    @Test
    @DisplayName("No SMS for undecided or non-tour leads")
    void ignoresOtherLeads() {
        MarketplaceLeadTbl pending = tour(LeadStatus.NEW, Instant.now().plus(1, ChronoUnit.DAYS));
        MarketplaceLeadTbl booking = tour(LeadStatus.APPROVED, Instant.now().plus(1, ChronoUnit.DAYS));
        booking.setLeadType(LeadType.BOOKING);
        when(leadRepository.findById(pending.getId())).thenReturn(Optional.of(pending));
        when(leadRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        service.notifyDecision(pending.getId());
        service.notifyDecision(booking.getId());

        verifyNoInteractions(smsService);
    }

    @Test
    @DisplayName("Reminders go only to tours this run claims, and not to ones approved within the last hour")
    void remindersClaimAndSkipRecentApprovals() {
        Instant soon = Instant.now().plus(90, ChronoUnit.MINUTES);
        MarketplaceLeadTbl due = tour(LeadStatus.APPROVED, soon);
        due.setDecidedAt(Instant.now().minus(1, ChronoUnit.DAYS));
        MarketplaceLeadTbl claimedElsewhere = tour(LeadStatus.APPROVED, soon);
        claimedElsewhere.setDecidedAt(Instant.now().minus(1, ChronoUnit.DAYS));
        MarketplaceLeadTbl justApproved = tour(LeadStatus.APPROVED, soon);
        justApproved.setDecidedAt(Instant.now().minus(10, ChronoUnit.MINUTES));
        when(leadRepository.findToursDueForReminder(any(Instant.class), any(Instant.class), any(Pageable.class)))
                .thenReturn(List.of(due, claimedElsewhere, justApproved));
        when(leadRepository.claimReminder(eq(due.getId()), any(Instant.class))).thenReturn(1);
        when(leadRepository.claimReminder(eq(claimedElsewhere.getId()), any(Instant.class))).thenReturn(0);
        when(leadRepository.claimReminder(eq(justApproved.getId()), any(Instant.class))).thenReturn(1);

        assertEquals(1, service.sendDueReminders());

        TemplatedMessage message = sentMessage();
        assertEquals(MessageTemplate.TOUR_REMINDER, message.template());
        assertEquals("Test Residency", message.variables().get("property"));
    }

    private TemplatedMessage sentMessage() {
        ArgumentCaptor<TemplatedMessage> captor = ArgumentCaptor.forClass(TemplatedMessage.class);
        verify(smsService).sendToPhone(eq(PHONE), captor.capture());
        return captor.getValue();
    }

    private MarketplaceLeadTbl tour(LeadStatus status, Instant slot) {
        MarketplaceLeadTbl lead = MarketplaceLeadTbl.builder()
                .propertyId(propertyId)
                .unitId(UUID.randomUUID())
                .leadType(LeadType.TOUR_REQUEST)
                .status(status)
                .prospectName("Jane Doe")
                .prospectPhone(PHONE)
                .preferredSlot(slot)
                .build();
        lead.setId(UUID.randomUUID());
        return lead;
    }
}
