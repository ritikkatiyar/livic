package com.livic.verticals.marketplace.service.interfaces;

import java.util.UUID;

/** Text messages to prospects about their tour requests. Delivery failures are logged, never thrown. */
public interface TourRequestNotificationService {

    /** Tells the prospect the landlord approved or declined their tour. Does nothing for undecided requests. */
    void notifyDecision(UUID leadId);

    /** Sends the reminder for approved tours starting soon, at most once per tour. Returns how many were sent. */
    int sendDueReminders();
}
