package com.livic.core.community.announcement.event;

import java.util.List;

/** A notice went out to the residents it targets. */
public record AnnouncementBroadcastEvent(
        String announcementId,
        String title,
        String content,
        String category,
        String severity,
        List<String> recipientUserIds
) {
}
