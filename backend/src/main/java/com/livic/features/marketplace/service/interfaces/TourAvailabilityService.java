package com.livic.features.marketplace.service.interfaces;

import com.livic.features.marketplace.dto.TourAvailabilityDTOs.BlackoutResponse;
import com.livic.features.marketplace.dto.TourAvailabilityDTOs.CreateBlackoutRequest;
import com.livic.features.marketplace.dto.TourAvailabilityDTOs.TourAvailabilityResponse;
import com.livic.features.marketplace.dto.TourAvailabilityDTOs.TourSlotsResponse;
import com.livic.features.marketplace.dto.TourAvailabilityDTOs.UpdateTourAvailabilityRequest;
import com.livic.features.marketplace.slots.TourSchedule;

import java.time.Instant;
import java.util.UUID;

/** Landlord-defined visiting hours for marketplace tours, and the visit slots derived from them. */
public interface TourAvailabilityService {

    TourAvailabilityResponse getAvailability(UUID propertyId);

    TourAvailabilityResponse updateAvailability(
            UUID propertyId, UpdateTourAvailabilityRequest request, UUID userId);

    BlackoutResponse addBlackout(UUID propertyId, CreateBlackoutRequest request, UUID userId);

    /** Checks the caller may manage tours at the blackout's property. */
    void deleteBlackout(UUID blackoutId);

    /**
     * Visit slots for a publicly listed property. With a valid OTP session token, slots the landlord declined for that
     * phone are marked; an invalid or expired token is treated like an anonymous visitor.
     */
    TourSlotsResponse getTourSlots(UUID propertyId, String otpSessionToken);

    /**
     * Throws {@link com.livic.features.marketplace.exception.TourSlotUnavailableException} unless {@code slot} is one
     * of the property's bookable slots for {@code phone}. Must run inside the transaction that creates the request:
     * for capacity-limited properties it locks the settings row so concurrent requests are counted one at a time.
     */
    void requireBookableSlot(UUID propertyId, String phone, Instant slot);

    /** The property's current schedule (defaults when not customized), with blackouts from today onwards. */
    TourSchedule getSchedule(UUID propertyId);
}
