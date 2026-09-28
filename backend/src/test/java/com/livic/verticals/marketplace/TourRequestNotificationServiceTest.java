package com.livic.verticals.marketplace;

import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.facade.PropertyFacade;
import com.livic.platform.common.domain.LeadStatus;
import com.livic.platform.common.domain.LeadType;
import com.livic.platform.notification.domain.MessageTemplate;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.dto.DeliveryReport;
import com.livic.platform.notification.dto.DeliveryReport.Outcome;
import com.livic.platform.notification.dto.TemplatedMessage;
import com.livic.platform.notification.service.MessagingService;
import com.livic.verticals.marketplace.domain.MarketplaceLeadTbl;
import com.livic.verticals.marketplace.domain.TourMessageType;
import com.livic.verticals.marketplace.repository.MarketplaceLeadRepository;
import com.livic.verticals.marketplace.service.impl.TourRequestNotificationServiceImpl;
import com.livic.verticals.marketplace.service.interfaces.TourAvailabilityService;
import com.livic.verticals.marketplace.service.interfaces.TourMessageSettingsService;
import com.livic.verticals.marketplace.slots.TourSchedule;
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
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TourRequestNotificationServiceTest {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final String PHONE = "9876543210";
    private static final Set<NotificationChannel> BOTH = Set.of(NotificationChannel.SMS, NotificationChannel.WHATSAPP);

    @Mock private MarketplaceLeadRepository leadRepository;
    @Mock private PropertyFacade propertyFacade;
    @Mock private TourAvailabilityService tourAvailabilityService;
    @Mock private TourMessageSettingsService tourMessageSettingsService;
    @Mock private MessagingService messagingService;
    @InjectMocks private TourRequestNotificationServiceImpl service;

    private final UUID propertyId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "marketplaceBaseUrl", "https://livic.in");
        lenient().when(propertyFacade.getPropertyById(propertyId)).thenReturn(Optional.of(
                new PropertySummaryDTO(propertyId, "Test Residency", "12 MG Road", "Pune", null, 3, true)));
        lenient().when(tourAvailabilityService.getSchedule(propertyId)).thenReturn(TourSchedule.defaults(List.of()));
        lenient().when(tourMessageSettingsService.channelsFor(eq(propertyId), any())).thenReturn(BOTH);
        lenient().when(messagingService.send(eq(PHONE), any(TemplatedMessage.class), anySet()))
                .thenReturn(new DeliveryReport(Map.of(NotificationChannel.SMS, Outcome.SENT)));
    }

    @Test
    @DisplayName("Approval shows the visit in the property timezone with the first name and My Requests link")
    void approvalMessage() {
        // 11:00 AM in India
        MarketplaceLeadTbl lead = tour(LeadStatus.APPROVED, LocalDateTime.of(2026, 9, 17, 11, 0).atZone(IST).toInstant());
        when(leadRepository.findById(lead.getId())).thenReturn(Optional.of(lead));

        service.notifyDecision(lead.getId());

        TemplatedMessage message = sentMessage(Set.of(NotificationChannel.SMS));
        assertEquals(MessageTemplate.TOUR_APPROVED, message.template());
        assertEquals(Map.of(
                "name", "Jane",
                "property", "Test Residency",
                "date", "Thu, 17 Sep",
                "time", "11:00 AM",
                "link", "https://livic.in/market-place/my-requests"), message.variables());
        verify(tourMessageSettingsService).channelsFor(propertyId, TourMessageType.DECISION);
    }

    @Test
    @DisplayName("WhatsApp goes only to prospects who opted in")
    void whatsappNeedsOptIn() {
        MarketplaceLeadTbl optedIn = tour(LeadStatus.APPROVED, Instant.now().plus(1, ChronoUnit.DAYS));
        optedIn.setWhatsappOptIn(true);
        when(leadRepository.findById(optedIn.getId())).thenReturn(Optional.of(optedIn));

        service.notifyDecision(optedIn.getId());

        verify(messagingService).send(eq(PHONE), any(TemplatedMessage.class), eq(BOTH));
    }

    @Test
    @DisplayName("Nothing is sent when the property turned every channel off for the message")
    void channelsOff() {
        MarketplaceLeadTbl lead = tour(LeadStatus.APPROVED, Instant.now().plus(1, ChronoUnit.DAYS));
        when(leadRepository.findById(lead.getId())).thenReturn(Optional.of(lead));
        when(tourMessageSettingsService.channelsFor(propertyId, TourMessageType.DECISION)).thenReturn(Set.of(NotificationChannel.WHATSAPP));

        // WhatsApp only, but the prospect did not opt in
        service.notifyDecision(lead.getId());

        verifyNoInteractions(messagingService);
    }

    @Test
    @DisplayName("Decline carries the landlord note, or a fixed phrase when there is none")
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
        verify(messagingService, times(2)).send(eq(PHONE), captor.capture(), anySet());
        assertEquals(MessageTemplate.TOUR_DECLINED, captor.getAllValues().get(0).template());
        assertEquals("4:30 PM", captor.getAllValues().get(0).variables().get("time"));
        assertEquals("Fully booked that day", captor.getAllValues().get(0).variables().get("note"));
        assertEquals("The slot isn't available.", captor.getAllValues().get(1).variables().get("note"));
    }

    @Test
    @DisplayName("No message for undecided or non-tour leads")
    void ignoresOtherLeads() {
        MarketplaceLeadTbl pending = tour(LeadStatus.NEW, Instant.now().plus(1, ChronoUnit.DAYS));
        MarketplaceLeadTbl booking = tour(LeadStatus.APPROVED, Instant.now().plus(1, ChronoUnit.DAYS));
        booking.setLeadType(LeadType.BOOKING);
        when(leadRepository.findById(pending.getId())).thenReturn(Optional.of(pending));
        when(leadRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        service.notifyDecision(pending.getId());
        service.notifyDecision(booking.getId());

        verifyNoInteractions(messagingService);
    }

    @Test
    @DisplayName("Reminders use the reminder channels, go only to tours this run claims, and skip recent approvals")
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

        TemplatedMessage message = sentMessage(Set.of(NotificationChannel.SMS));
        assertEquals(MessageTemplate.TOUR_REMINDER, message.template());
        assertEquals("Test Residency", message.variables().get("property"));
        verify(tourMessageSettingsService).channelsFor(propertyId, TourMessageType.REMINDER);
    }

    private TemplatedMessage sentMessage(Set<NotificationChannel> channels) {
        ArgumentCaptor<TemplatedMessage> captor = ArgumentCaptor.forClass(TemplatedMessage.class);
        verify(messagingService).send(eq(PHONE), captor.capture(), eq(channels));
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
