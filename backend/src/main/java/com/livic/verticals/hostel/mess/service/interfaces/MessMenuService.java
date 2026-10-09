package com.livic.verticals.hostel.mess.service.interfaces;

import com.livic.verticals.hostel.mess.dto.MessMenuResponse;
import com.livic.verticals.hostel.mess.dto.UpdateMealSlotsRequest;
import com.livic.verticals.hostel.mess.dto.UpdateMessSettingsRequest;
import com.livic.verticals.hostel.mess.dto.UpdateWeekMenuRequest;

import java.util.UUID;

/** The weekly mess menu a property repeats every week, and whether its residents can see it. */
public interface MessMenuService {

    MessMenuResponse getMenu(UUID propertyId);

    MessMenuResponse updateSettings(UUID propertyId, UpdateMessSettingsRequest request, UUID userId);

    MessMenuResponse updateSlots(UUID propertyId, UpdateMealSlotsRequest request, UUID userId);

    MessMenuResponse updateWeek(UUID propertyId, UpdateWeekMenuRequest request, UUID userId);

    /** The menu where the user lives, or a disabled, empty menu when none of their homes has the mess switched on. */
    MessMenuResponse getMyMenu(UUID userId);
}
