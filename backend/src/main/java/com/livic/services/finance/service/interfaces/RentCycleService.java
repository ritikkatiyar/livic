package com.livic.services.finance.service.interfaces;

import com.livic.services.finance.domain.RentCycleStatus;
import com.livic.services.finance.dto.RentCycleDTOs;
import com.livic.platform.payment.dto.PaymentInitiationResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.UUID;

public interface RentCycleService {
    RentCycleDTOs.RentCycleResponse generate(RentCycleDTOs.GenerateRentCycleRequest request);

    RentCycleDTOs.BatchGenerateResult batchGenerate(RentCycleDTOs.BatchGenerateRentCycleRequest request);

    RentCycleDTOs.PreFlightChecklistResponse getPreFlightChecklist(UUID propertyId, String billingMonth);

    RentCycleDTOs.RentCycleListResponse list(UUID currentUserId, UUID propertyId, UUID leaseId, String billingMonth, RentCycleStatus status, String search, Pageable pageable);

    RentCycleDTOs.RentCycleResponse markPaid(UUID id);

    RentCycleDTOs.RentCycleResponse publish(UUID id);

    RentCycleDTOs.RentCycleResponse unpublish(UUID id);

    RentCycleDTOs.BatchPublishResult batchPublish(UUID propertyId, String billingMonth);

    RentCycleDTOs.BatchUnpublishResult batchUnpublish(UUID propertyId, String billingMonth);

    PaymentInitiationResponse initiateOnlinePayment(UUID rentCycleId, UUID payerUserId);

    PaymentInitiationResponse recordCashPayment(UUID rentCycleId, BigDecimal amount, String note, UUID payerUserId, UUID confirmedBy);
}
