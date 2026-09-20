package com.livic.core.finance.service.interfaces;

import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.platform.payment.dto.PaymentInitiationResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.UUID;

public interface BillService {

    /** One bill with its payer, unit and lines — how rental renders what it generated. */
    BillDTOs.BillResponse getById(UUID id);
    BillDTOs.BillListResponse list(UUID currentUserId, UUID propertyId, UUID leaseId, String billingMonth, BillStatus status, String search, Pageable pageable);

    BillDTOs.BillResponse markPaid(UUID id);

    BillDTOs.BillResponse publish(UUID id);

    BillDTOs.BillResponse unpublish(UUID id);

    BillDTOs.BatchPublishResult batchPublish(UUID propertyId, String billingMonth);

    BillDTOs.BatchUnpublishResult batchUnpublish(UUID propertyId, String billingMonth);

    PaymentInitiationResponse initiateOnlinePayment(UUID billId, UUID payerUserId);

    PaymentInitiationResponse recordCashPayment(UUID billId, BigDecimal amount, String note, UUID payerUserId, UUID confirmedBy);
}
