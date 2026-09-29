package com.livic.verticals.marketplace.dto;

import jakarta.validation.constraints.NotNull;

/** Whether a tour message goes out on each channel. */
public record ChannelChoice(
    @NotNull(message = "Choose whether to send SMS") Boolean sms,
    @NotNull(message = "Choose whether to send WhatsApp") Boolean whatsapp
) {}
