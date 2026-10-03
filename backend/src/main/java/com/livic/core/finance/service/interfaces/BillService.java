package com.livic.core.finance.service.interfaces;

import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.dto.BillDTOs;
import com.livic.platform.payment.dto.PaymentInitiationResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface BillService {

    /** One bill with its payer, unit and lines — how rental renders what it generated. */
    BillDTOs.BillResponse getById(UUID id);

    /** Converts a collection of bill entities into enriched DTO responses using batch queries. */
    List<BillDTOs.BillResponse> toResponses(List<BillTbl> bills);

    /** Staff view: bills of the properties where the user holds BILL_VIEW, or of one of them. */
    BillDTOs.BillListResponse list(UUID currentUserId, UUID propertyId, String billingMonth, BillStatus status, String search, Pageable pageable);

    /** The bills a user pays, for every unit they pay for; drafts are left out. */
    BillDTOs.BillListResponse listForPayer(UUID userId, String billingMonth, BillStatus status, Pageable pageable);

    BillDTOs.BillResponse markPaid(UUID id);

    /** One payer's bills, e.g. for a vertical showing the bills of its agreement with them. */
    BillDTOs.BillListResponse listForMember(UUID memberId, String billingMonth, BillStatus status,
                                            boolean includeUnpublished, Pageable pageable);

    /** Before generating a month's bills: payers against beds, and meter readings against occupied units. */
    BillDTOs.PreFlightChecklistResponse getPreFlightChecklist(UUID propertyId, String billingMonth);

    BillDTOs.BillResponse publish(UUID id);

    BillDTOs.BillResponse unpublish(UUID id);

    BillDTOs.BatchPublishResult batchPublish(UUID propertyId, String billingMonth);

    BillDTOs.BatchUnpublishResult batchUnpublish(UUID propertyId, String billingMonth);

    PaymentInitiationResponse initiateOnlinePayment(UUID billId, UUID payerUserId);

    PaymentInitiationResponse recordCashPayment(UUID billId, BigDecimal amount, String note, UUID payerUserId, UUID confirmedBy);
}
