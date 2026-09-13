package com.livic.finance.controller;

import com.livic.security.UserDetailsImpl;
import com.livic.common.response.ApiResponse;
import com.livic.finance.dto.UnitBookingDTOs.CreateBookingRequest;
import com.livic.finance.dto.UnitBookingDTOs.UnitBookingResponse;
import com.livic.finance.service.interfaces.UnitBookingService;
import com.livic.payment.dto.PaymentTransactionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/unit-bookings")
@RequiredArgsConstructor
@Slf4j
public class UnitBookingController {

    private final UnitBookingService unitBookingService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<UnitBookingResponse>>> listBookings(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) UUID propertyId,
            Pageable pageable
    ) {
        UUID currentUserId = getCallerUserId(currentUser);
        log.info("unit_bookings_requested propertyId={} currentUserId={}", propertyId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(unitBookingService.listBookings(currentUserId, propertyId, pageable)));
    }

    @PostMapping
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId(), 'LEASE_CREATE')")
    public ResponseEntity<ApiResponse<UnitBookingResponse>> createBooking(
            @Valid @RequestBody CreateBookingRequest request
    ) {
        log.info("unit_booking_create_requested unitId={}", request.unitId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(unitBookingService.createBooking(request)));
    }

    @PostMapping("/{id}/forfeit")
    public ResponseEntity<ApiResponse<UnitBookingResponse>> forfeitBooking(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        UUID callerUserId = getCallerUserId(userDetails);
        log.info("unit_booking_forfeit_requested bookingId={} callerUserId={}", id, callerUserId);
        return ResponseEntity.ok(ApiResponse.success(unitBookingService.forfeitBooking(id, callerUserId)));
    }

    @PostMapping("/{id}/refund")
    public ResponseEntity<ApiResponse<UnitBookingResponse>> refundBooking(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        UUID callerUserId = getCallerUserId(userDetails);
        log.info("unit_booking_refund_requested bookingId={} callerUserId={}", id, callerUserId);
        return ResponseEntity.ok(ApiResponse.success(unitBookingService.refundBooking(id, callerUserId)));
    }

    @PostMapping("/{id}/token-payment/online")
    public ResponseEntity<ApiResponse<PaymentTransactionResponse>> initiateTokenOnlinePayment(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        UUID callerUserId = getCallerUserId(userDetails);
        log.info("unit_booking_token_online_payment_requested bookingId={} callerUserId={}", id, callerUserId);
        return ResponseEntity.ok(ApiResponse.success(unitBookingService.initiateTokenOnlinePayment(id, callerUserId)));
    }

    @PostMapping("/{id}/token-payment/cash")
    public ResponseEntity<ApiResponse<PaymentTransactionResponse>> recordTokenCashPayment(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        UUID callerUserId = getCallerUserId(userDetails);
        Object amountObj = request.get("amount");
        BigDecimal amount = amountObj != null ? new BigDecimal(amountObj.toString()) : BigDecimal.ZERO;
        String note = (String) request.get("note");

        log.info("unit_booking_token_cash_payment_requested bookingId={} amount={} callerUserId={}", id, amount, callerUserId);

        return ResponseEntity.ok(ApiResponse.success(unitBookingService.recordTokenCashPayment(id, amount, note, callerUserId)));
    }

    private UUID getCallerUserId(UserDetailsImpl userDetails) {
        return userDetails != null ? UUID.fromString(userDetails.getId()) : null;
    }
}
