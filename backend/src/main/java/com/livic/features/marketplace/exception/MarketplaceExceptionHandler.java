package com.livic.features.marketplace.exception;

import com.livic.features.marketplace.controller.MarketplaceLeadController;
import com.livic.features.marketplace.controller.MyTourRequestController;
import com.livic.features.marketplace.controller.TourRequestManagementController;
import com.livic.features.marketplace.dto.TourRequestDTOs.DuplicateTourRequestError;
import com.livic.features.marketplace.dto.TourRequestDTOs.TourSlotUnavailableError;
import com.livic.platform.common.exception.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

/**
 * Marketplace-specific error responses. Runs before the global handler (which still handles every other exception)
 * so a duplicate tour request can carry the blocking request in its 409 body.
 */
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(assignableTypes = {
        MarketplaceLeadController.class,
        MyTourRequestController.class,
        TourRequestManagementController.class
})
public class MarketplaceExceptionHandler {

    @ExceptionHandler(DuplicateTourRequestException.class)
    public ResponseEntity<DuplicateTourRequestError> handleDuplicateTourRequest(
            DuplicateTourRequestException exception,
            HttpServletRequest request
    ) {
        log.warn("[DUPLICATE_TOUR_REQUEST] uri={} existingLeadId={}", request.getRequestURI(),
                exception.getExistingRequest() != null ? exception.getExistingRequest().leadId() : null);

        HttpStatus status = HttpStatus.CONFLICT;
        return ResponseEntity.status(status).body(new DuplicateTourRequestError(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                exception.getMessage(),
                request.getRequestURI(),
                exception.getExistingRequest()
        ));
    }

    @ExceptionHandler(TourSlotUnavailableException.class)
    public ResponseEntity<TourSlotUnavailableError> handleTourSlotUnavailable(
            TourSlotUnavailableException exception,
            HttpServletRequest request
    ) {
        log.warn("[TOUR_SLOT_UNAVAILABLE] uri={} reason={} slot={}", request.getRequestURI(), exception.getReason(), exception.getSlot());

        HttpStatus status = HttpStatus.CONFLICT;
        return ResponseEntity.status(status).body(new TourSlotUnavailableError(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                exception.getMessage(),
                request.getRequestURI(),
                exception.getReason().code(),
                exception.getSlot()
        ));
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ApiError> handleConcurrentUpdate(
            ObjectOptimisticLockingFailureException exception,
            HttpServletRequest request
    ) {
        log.warn("[TOUR_REQUEST_CONCURRENT_UPDATE] uri={}", request.getRequestURI());
        HttpStatus status = HttpStatus.CONFLICT;
        return ResponseEntity.status(status).body(ApiError.of(
                status.value(),
                status.getReasonPhrase(),
                "This tour request was just updated by someone else. Please refresh and try again.",
                request.getRequestURI()
        ));
    }
}
