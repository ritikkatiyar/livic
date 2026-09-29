package com.livic.verticals.marketplace.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

/** The channels a property wants for each kind of tour message. */
public record UpdateTourMessageSettingsRequest(
    @NotNull(message = "Decision message channels are required") @Valid ChannelChoice decision,
    @NotNull(message = "Reminder channels are required") @Valid ChannelChoice reminder
) {}
