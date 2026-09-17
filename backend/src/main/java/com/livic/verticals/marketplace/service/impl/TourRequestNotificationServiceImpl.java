package com.livic.verticals.marketplace.service.impl;

import com.livic.verticals.marketplace.domain.MarketplaceLeadTbl;
import com.livic.verticals.marketplace.repository.MarketplaceLeadRepository;
import com.livic.verticals.marketplace.service.interfaces.TourAvailabilityService;
import com.livic.verticals.marketplace.service.interfaces.TourRequestNotificationService;
import com.livic.platform.notification.domain.MessageTemplate;
import com.livic.platform.notification.dto.TemplatedMessage;
import com.livic.platform.notification.service.SmsService;
import com.livic.core.property.dto.PropertySummaryDTO;
import com.livic.core.property.facade.PropertyFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TourRequestNotificationServiceImpl implements TourRequestNotificationService {

    /** Reminders go out for approved tours starting within this lead time. */
    static final Duration REMINDER_LEAD_TIME = Duration.ofHours(2);
    /** A tour approved this recently already got the approval SMS, which serves as its reminder. */
    static final Duration RECENT_APPROVAL = Duration.ofHours(1);
    private static final int REMINDER_BATCH_SIZE = 100;

    static final String NO_NOTE = "The slot isn't available.";
    private static final String MY_REQUESTS_PATH = "/market-place/my-requests";
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("EEE, d MMM", Locale.ENGLISH);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);

    private final MarketplaceLeadRepository leadRepository;
    private final PropertyFacade propertyFacade;
    private final TourAvailabilityService tourAvailabilityService;
    private final SmsService smsService;

    @Value("${app.marketplace.base-url:http://localhost:3000}")
    private String marketplaceBaseUrl;

    @Override
    public void notifyDecision(UUID leadId) {
        MarketplaceLeadTbl lead = leadRepository.findById(leadId).orElse(null);
        if (lead == null || !lead.isTourRequest() || lead.getPreferredSlot() == null) {
            return;
        }
        MessageTemplate template = switch (lead.getStatus()) {
            case APPROVED -> MessageTemplate.TOUR_APPROVED;
            case REJECTED -> MessageTemplate.TOUR_DECLINED;
            default -> null;
        };
        if (template == null) {
            return;
        }

        Map<String, String> variables = visitVariables(lead);
        variables.put("name", firstName(lead.getProspectName()));
        if (template == MessageTemplate.TOUR_DECLINED) {
            variables.put("note", lead.getDecisionNote() == null || lead.getDecisionNote().isBlank() ? NO_NOTE : lead.getDecisionNote());
        }
        boolean sent = smsService.sendToPhone(lead.getProspectPhone(), TemplatedMessage.of(template, variables));
        log.info("tour_decision_sms leadId={} template={} sent={}", leadId, template, sent);
    }

    @Override
    public int sendDueReminders() {
        Instant now = Instant.now();
        List<MarketplaceLeadTbl> due = leadRepository.findToursDueForReminder(
                now, now.plus(REMINDER_LEAD_TIME), PageRequest.of(0, REMINDER_BATCH_SIZE));

        int sent = 0;
        for (MarketplaceLeadTbl lead : due) {
            // Claim first so a concurrent run (another instance) can't send the same reminder
            if (leadRepository.claimReminder(lead.getId(), now) == 0) {
                continue;
            }
            if (lead.getDecidedAt() != null && lead.getDecidedAt().isAfter(now.minus(RECENT_APPROVAL))) {
                log.info("tour_reminder_skipped leadId={} reason=recently_approved", lead.getId());
                continue;
            }
            TemplatedMessage message = TemplatedMessage.of(MessageTemplate.TOUR_REMINDER, visitVariables(lead));
            if (smsService.sendToPhone(lead.getProspectPhone(), message)) {
                sent++;
            }
        }
        if (!due.isEmpty()) {
            log.info("tour_reminders_processed due={} sent={}", due.size(), sent);
        }
        return sent;
    }

    /** Property, visit date and time in the property's timezone, and the My Requests link. */
    private Map<String, String> visitVariables(MarketplaceLeadTbl lead) {
        String propertyName = propertyFacade.getPropertyById(lead.getPropertyId())
                .map(PropertySummaryDTO::name)
                .orElse("your selected property");
        ZoneId zone = tourAvailabilityService.getSchedule(lead.getPropertyId()).zone();
        ZonedDateTime visit = lead.getPreferredSlot().atZone(zone);

        Map<String, String> variables = new HashMap<>();
        variables.put("property", propertyName);
        variables.put("date", DATE.format(visit));
        variables.put("time", TIME.format(visit));
        variables.put("link", marketplaceBaseUrl + MY_REQUESTS_PATH);
        return variables;
    }

    private static String firstName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "there";
        }
        return fullName.strip().split("\s+")[0];
    }
}
