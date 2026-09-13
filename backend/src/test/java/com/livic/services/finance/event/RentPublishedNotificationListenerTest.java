package com.livic.services.finance.event;

import com.livic.platform.common.event.RentPublishedEvent;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RentPublishedNotificationListenerTest {

    @Mock
    private NotificationService notificationService;

    private RentPublishedNotificationListener listener;

    @BeforeEach
    public void setUp() {
        listener = new RentPublishedNotificationListener(notificationService);
    }

    @Test
    public void testOnRentPublished_DispatchesAllThreeChannels() {
        UUID tenantId = UUID.randomUUID();
        UUID rentCycleId = UUID.randomUUID();
        RentPublishedEvent event = new RentPublishedEvent(
                this,
                rentCycleId,
                tenantId,
                "2026-09",
                BigDecimal.valueOf(25000),
                LocalDate.of(2026, 9, 10)
        );

        listener.onRentPublished(event);

        verify(notificationService, times(1)).send(
                eq(tenantId.toString()),
                eq(NotificationChannel.EMAIL),
                contains("Rent Statement Published"),
                contains("25,000.00")
        );

        verify(notificationService, times(1)).send(
                eq(tenantId.toString()),
                eq(NotificationChannel.PUSH),
                contains("Rent Statement Published"),
                contains("25,000.00")
        );

        verify(notificationService, times(1)).send(
                eq(tenantId.toString()),
                eq(NotificationChannel.WHATSAPP),
                contains("Rent Statement Published"),
                contains("2026")
        );
    }

    @Test
    public void testOnRentPublished_ContinuesWhenOneChannelFails() {
        UUID tenantId = UUID.randomUUID();
        UUID rentCycleId = UUID.randomUUID();
        RentPublishedEvent event = new RentPublishedEvent(
                this,
                rentCycleId,
                tenantId,
                "2026-09",
                BigDecimal.valueOf(25000),
                LocalDate.of(2026, 9, 10)
        );

        // Fail email dispatch
        doThrow(new RuntimeException("SMTP connect timeout"))
                .when(notificationService)
                .send(eq(tenantId.toString()), eq(NotificationChannel.EMAIL), anyString(), anyString());

        listener.onRentPublished(event);

        // Verify PUSH and WHATSAPP were still attempted and invoked
        verify(notificationService, times(1)).send(
                eq(tenantId.toString()),
                eq(NotificationChannel.PUSH),
                anyString(),
                anyString()
        );

        verify(notificationService, times(1)).send(
                eq(tenantId.toString()),
                eq(NotificationChannel.WHATSAPP),
                anyString(),
                anyString()
        );
    }
}
