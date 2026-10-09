package com.livic.verticals.hostel.mess.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateMessSettingsRequest(
    @NotNull(message = "Choose whether residents can see the menu") Boolean enabled
) {}
