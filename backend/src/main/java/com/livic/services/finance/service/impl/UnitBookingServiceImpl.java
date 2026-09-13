package com.livic.services.finance.service.impl;

import com.livic.platform.auth.service.interfaces.AuthorizationService;
import com.livic.platform.common.domain.UnitBookingStatus;
import com.livic.platform.common.enums.ResourceType;
import com.livic.platform.common.exception.BusinessException;
import com.livic.services.finance.domain.UnitBookingTbl;
import com.livic.services.finance.dto.UnitBookingDTOs;
import com.livic.services.finance.dto.UnitBookingDTOs.UnitBookingResponse;
import com.livic.services.finance.mapper.UnitBookingMapper;
import com.livic.services.finance.service.interfaces.LeaseQueryService;
import com.livic.services.finance.service.interfaces.UnitBookingCrudService;
import com.livic.services.finance.service.interfaces.UnitBookingService;
import com.livic.platform.payment.dto.PaymentTransactionResponse;
import com.livic.platform.payment.facade.PaymentFacade;
import com.livic.services.property.dto.PropertySummaryDTO;
import com.livic.services.property.dto.UnitSummaryDTO;
import com.livic.services.property.facade.PropertyFacade;
import com.livic.services.property.facade.UnitFacade;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UnitBookingServiceImpl implements UnitBookingService {

    private final UnitBookingCrudService unitBookingCrudService;
    private final LeaseQueryService leaseQueryService;
    private final UnitFacade unitFacade;
    private final PropertyFacade propertyFacade;
    private final PaymentFacade paymentFacade;
    private final AuthorizationService authorizationService;
    private final UserFacade userFacade;

    @Override
    public UnitBookingDTOs.UnitBookingResponse createBooking(UnitBookingDTOs.CreateBookingRequest request) {
        log.info("Processing booking creation for unit: {}, tenant name: {}", request.unitId(), request.prospectiveTenantName());

        boolean available = leaseQueryService.isUnitAvailableOnDate(request.unitId(), request.expectedMoveInDate());
        if (!available) {
            throw new BusinessException(HttpStatus.CONFLICT, "No vacancy available in this unit on the requested date");
        }

        UnitSummaryDTO unitSummary = unitFacade.getUnitById(request.unitId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit not found"));

        UnitBookingTbl booking = UnitBookingMapper.toEntity(request, unitSummary.id());
        booking = unitBookingCrudService.save(booking);
        return UnitBookingMapper.toResponse(booking, unitSummary.unitNumber());
    }

    @Override
    public UnitBookingDTOs.UnitBookingResponse forfeitBooking(UUID bookingId, UUID userDetailsId) {
        log.info("Processing booking forfeit for ID: {} by user: {}", bookingId, userDetailsId);
        UnitBookingTbl booking = getBookingOrThrow(bookingId);

        if (!authorizationService.hasPermission(ResourceType.UNIT, booking.getUnitId(), "LEASE_UPDATE")) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Access Denied");
        }

        booking.setStatus(UnitBookingStatus.FORFEITED.name());
        booking = unitBookingCrudService.save(booking);
        String unitNumber = unitFacade.getUnitById(booking.getUnitId()).map(UnitSummaryDTO::unitNumber).orElse("N/A");
        return UnitBookingMapper.toResponse(booking, unitNumber);
    }

    @Override
    public UnitBookingDTOs.UnitBookingResponse refundBooking(UUID bookingId, UUID userDetailsId) {
        log.info("Processing booking refund for ID: {} by user: {}", bookingId, userDetailsId);
        UnitBookingTbl booking = getBookingOrThrow(bookingId);

        if (!authorizationService.hasPermission(ResourceType.UNIT, booking.getUnitId(), "LEASE_UPDATE")) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Access Denied");
        }

        booking.setStatus(UnitBookingStatus.REFUNDED.name());
        booking = unitBookingCrudService.save(booking);
        String unitNumber = unitFacade.getUnitById(booking.getUnitId()).map(UnitSummaryDTO::unitNumber).orElse("N/A");
        return UnitBookingMapper.toResponse(booking, unitNumber);
    }

    @Override
    public PaymentTransactionResponse initiateTokenOnlinePayment(UUID bookingId, UUID userDetailsId) {
        log.info("Initiating online token payment for booking: {} by user: {}", bookingId, userDetailsId);
        UnitBookingTbl booking = getBookingOrThrow(bookingId);

        if (!authorizationService.hasPermission(ResourceType.UNIT, booking.getUnitId(), "LEASE_CREATE")) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Access Denied");
        }

        if (!UnitBookingStatus.BOOKED.name().equals(booking.getStatus())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Booking is not in BOOKED status");
        }

        UUID payerUserId = resolvePayerUserId(booking, userDetailsId);

        return paymentFacade.initiateOnlinePaymentTransaction(
                payerUserId,
                "UNIT_BOOKING",
                bookingId,
                booking.getTokenAmount()
        );
    }

    @Override
    public PaymentTransactionResponse recordTokenCashPayment(UUID bookingId, BigDecimal amount, String note, UUID userDetailsId) {
        log.info("Recording token cash payment for booking: {} amount: {} by user: {}", bookingId, amount, userDetailsId);
        UnitBookingTbl booking = getBookingOrThrow(bookingId);

        if (!authorizationService.hasPermission(ResourceType.UNIT, booking.getUnitId(), "LEASE_UPDATE")) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Access Denied");
        }

        if (!UnitBookingStatus.BOOKED.name().equals(booking.getStatus())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Booking is not in BOOKED status");
        }

        UUID payerUserId = resolvePayerUserId(booking, userDetailsId);

        return paymentFacade.recordCashPaymentTransaction(
                payerUserId,
                "UNIT_BOOKING",
                bookingId,
                amount,
                userDetailsId,
                note
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UnitBookingResponse> listBookings(UUID currentUserId, UUID propertyId, Pageable pageable) {
        try {
            Page<UnitBookingTbl> bookingsPage;

            if (propertyId != null) {
                List<UnitSummaryDTO> propertyUnits = unitFacade.getUnitsByPropertyId(propertyId);
                List<UUID> unitIds = propertyUnits.stream().map(UnitSummaryDTO::id).toList();
                if (unitIds.isEmpty()) {
                    return Page.empty(pageable);
                }
                bookingsPage = unitBookingCrudService.findByUnitIdIn(unitIds, pageable);
            } else if (currentUserId != null) {
                List<PropertySummaryDTO> userProperties = propertyFacade.getPropertiesByUserId(currentUserId);
                List<UUID> propertyIds = userProperties.stream().map(PropertySummaryDTO::id).toList();
                if (propertyIds.isEmpty()) {
                    bookingsPage = unitBookingCrudService.findByProspectiveTenantUserId(currentUserId, pageable);
                } else {
                    List<UnitSummaryDTO> units = unitFacade.getUnitsByPropertyIds(propertyIds);
                    List<UUID> unitIds = units.stream().map(UnitSummaryDTO::id).toList();
                    if (unitIds.isEmpty()) {
                        return Page.empty(pageable);
                    }
                    bookingsPage = unitBookingCrudService.findByUnitIdIn(unitIds, pageable);
                }
            } else {
                bookingsPage = unitBookingCrudService.findAll(pageable);
            }

            if (bookingsPage == null || bookingsPage.isEmpty()) {
                return Page.empty(pageable);
            }

            Set<UUID> unitIds = bookingsPage.getContent().stream()
                    .filter(b -> b.getUnitId() != null)
                    .map(UnitBookingTbl::getUnitId)
                    .collect(Collectors.toSet());

            Map<UUID, UnitSummaryDTO> unitsMap = unitIds.isEmpty() ? Map.of() : unitFacade.getUnitsByIds(unitIds);

            return bookingsPage.map(booking -> {
                UnitSummaryDTO u = booking.getUnitId() != null ? unitsMap.get(booking.getUnitId()) : null;
                String unitNumber = u != null ? u.unitNumber() : "N/A";
                return UnitBookingMapper.toResponse(booking, unitNumber);
            });
        } catch (Exception e) {
            log.error("Failed to list unit bookings for user: {} property: {}", currentUserId, propertyId, e);
            return Page.empty(pageable);
        }
    }

    private UnitBookingTbl getBookingOrThrow(UUID id) {
        return unitBookingCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit booking not found"));
    }

    private UUID resolvePayerUserId(UnitBookingTbl booking, UUID fallbackUserId) {
        UUID payerUserId = booking.getProspectiveTenantUserId();
        if (payerUserId == null) {
            if (booking.getProspectiveTenantEmail() != null) {
                UserSummaryDTO u = userFacade.getUserByEmail(booking.getProspectiveTenantEmail()).orElse(null);
                if (u != null) {
                    payerUserId = u.id();
                }
            }
        }
        return payerUserId != null ? payerUserId : fallbackUserId;
    }
}
