package com.livic.core.finance.service.impl;

import com.livic.platform.common.exception.BusinessException;
import com.livic.core.finance.domain.BillLineTbl;
import com.livic.core.finance.domain.BillStatus;
import com.livic.core.finance.domain.BillTbl;
import com.livic.core.finance.service.interfaces.PaymentStatementService;
import com.livic.core.finance.service.interfaces.BillLineCrudService;
import com.livic.core.finance.service.interfaces.BillCrudService;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.dto.UnitSummaryDTO;
import com.livic.core.property.facade.UnitFacade;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.platform.payment.constant.PaymentConstants;
import com.livic.platform.payment.dto.PaymentInitiationResponse;
import com.livic.platform.payment.facade.PaymentFacade;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PaymentStatementServiceImpl implements PaymentStatementService {

    private final BillCrudService billCrudService;
    private final BillLineCrudService billLineCrudService;
    private final UserFacade userFacade;
    private final UnitFacade unitFacade;
    private final UnitMemberFacade unitMemberFacade;
    private final PaymentFacade paymentFacade;

    @Override
    public String generateStatementHtml(UUID billId) {
        log.info("Generating payment statement HTML for Bill: {}", billId);

        BillTbl bill = billCrudService.findById(billId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));

        if (bill.getStatus() == BillStatus.PENDING) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Rent cycle invoice has not been published yet");
        }

        UnitResidentDTO payer = bill.getMemberId() == null ? null
                : unitMemberFacade.getResidentByMemberId(bill.getMemberId()).orElse(null);
        UserSummaryDTO tenant = payer == null ? null
                : userFacade.getUserById(payer.userId()).orElse(null);

        List<BillLineTbl> charges = billLineCrudService.findByBill_Id(billId);

        UUID unitId = payer != null ? payer.unitId() : null;
        UnitSummaryDTO unit = unitFacade.getUnitById(unitId).orElse(null);
        UUID propertyId = unit != null ? unit.propertyId() : null;
        String propertyName = unit != null ? unit.propertyName() : "N/A";
        String unitNumber = unit != null ? unit.unitNumber() : "N/A";

        String propertyIdShort = propertyId != null ? propertyId.toString().substring(0, 5).toUpperCase() : "PROP";
        String billIdShort = billId.toString().substring(0, 5).toUpperCase();
        String referenceNumber = String.format("%s-%s", propertyIdShort, billIdShort);

        String statusStr = bill.getStatus().name();
        String statusColor = "#E2E8F0";
        String statusTextColor = "#475569";

        if ("PAID".equals(statusStr)) {
            statusColor = "#DCFCE7";
            statusTextColor = "#166534";
        } else if ("PARTIALLY_PAID".equals(statusStr)) {
            statusColor = "#FEF9C3";
            statusTextColor = "#854D0E";
        } else if ("OVERDUE".equals(statusStr)) {
            statusColor = "#FEE2E2";
            statusTextColor = "#991B1B";
        } else if ("PUBLISHED".equals(statusStr)) {
            statusColor = "#DBEAFE";
            statusTextColor = "#1E40AF";
        }

        BigDecimal amountPaid = bill.getAmountPaid() != null ? bill.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal remainingBalance = bill.getTotalAmount().subtract(amountPaid);

        StringBuilder chargesRows = new StringBuilder();
        for (BillLineTbl charge : charges) {
            String amountFormatted = String.format("₹%,.2f", charge.getAmount());
            if (com.livic.platform.common.domain.RentChargeType.DISCOUNT.name().equals(charge.getChargeType().name())) {
                amountFormatted = "-" + amountFormatted;
            }
            chargesRows.append(String.format(
                    "<tr>" +
                    "  <td>%s</td>" +
                    "  <td>%s</td>" +
                    "  <td style=\"text-align: right;\">%s</td>" +
                    "</tr>",
                    charge.getChargeType(),
                    charge.getDescription(),
                    amountFormatted
            ));
        }

        String transactionDetailsHtml = "";
        {
            PaymentInitiationResponse tx = paymentFacade
                    .getLatestSuccessfulTransaction(
                            PaymentConstants.ReferenceType.BILL,
                            bill.getId())
                    .orElse(null);
            if (tx != null) {
                transactionDetailsHtml = String.format(
                        "<div class=\"section-title\">Transaction Details</div>" +
                        "<table class=\"details-table\">" +
                        "  <tr>" +
                        "    <td><strong>Payment Method:</strong></td>" +
                        "    <td>%s</td>" +
                        "    <td><strong>Transaction Reference ID:</strong></td>" +
                        "    <td>%s</td>" +
                        "  </tr>" +
                        "  <tr>" +
                        "    <td><strong>Settled At:</strong></td>" +
                        "    <td>%s</td>" +
                        "    <td><strong>Amount Settled:</strong></td>" +
                        "    <td>₹%,.2f</td>" +
                        "  </tr>" +
                        "</table>",
                        tx.getPaymentMethod() != null ? tx.getPaymentMethod() : "N/A",
                        tx.getGatewayTransactionId() != null ? tx.getGatewayTransactionId() : tx.getTransactionId(),
                        tx.getCreatedAt() != null ? tx.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm")) : "N/A",
                        tx.getAmount()
                );
            }
        }

        String tenantName = tenant != null ? tenant.fullName() : "N/A";
        String tenantPhone = tenant != null ? tenant.phoneNumber() : "N/A";
        String tenantEmail = tenant != null ? tenant.authUid() : "N/A";

        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "  <meta charset=\"utf-8\">\n" +
                "  <title>Payment Statement</title>\n" +
                "  <style>\n" +
                "    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; background-color: #ffffff; }\n" +
                "    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }\n" +
                "    .logo { font-size: 24px; font-weight: 800; color: #0f172a; }\n" +
                "    .logo span { color: #3b82f6; }\n" +
                "    .title-area { text-align: right; }\n" +
                "    .title-area h1 { margin: 0; font-size: 22px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }\n" +
                "    .ref-no { font-size: 14px; font-weight: 600; color: #64748b; }\n" +
                "    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }\n" +
                "    .details-table td { padding: 8px 0; vertical-align: top; font-size: 14px; }\n" +
                "    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; margin-top: 30px; }\n" +
                "    .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }\n" +
                "    .invoice-table th { background-color: #f8fafc; text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }\n" +
                "    .invoice-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }\n" +
                "    .status-pill { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; background-color: " + statusColor + "; color: " + statusTextColor + "; }\n" +
                "    .summary-area { display: flex; justify-content: flex-end; margin-bottom: 40px; }\n" +
                "    .summary-box { width: 300px; }\n" +
                "    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }\n" +
                "    .summary-row.total { font-size: 18px; font-weight: 700; color: #0f172a; border-top: 2px solid #e2e8f0; padding-top: 12px; margin-top: 8px; }\n" +
                "    .footer { text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 60px; }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class=\"header\">\n" +
                "    <div class=\"logo\">Living <span>Ecosystem</span></div>\n" +
                "    <div class=\"title-area\">\n" +
                "      <h1>Payment Statement</h1>\n" +
                "      <div class=\"ref-no\">Ref: " + referenceNumber + "</div>\n" +
                "    </div>\n" +
                "  </div>\n" +
                "\n" +
                "  <table class=\"details-table\">\n" +
                "    <tr>\n" +
                "      <td style=\"width: 50%;\">\n" +
                "        <strong>Billed To:</strong><br>\n" +
                "        " + tenantName + "<br>\n" +
                "        Phone: " + tenantPhone + "<br>\n" +
                "        Email: " + tenantEmail + "\n" +
                "      </td>\n" +
                "      <td style=\"width: 50%; text-align: right;\">\n" +
                "        <strong>Property Details:</strong><br>\n" +
                "        " + propertyName + "<br>\n" +
                "        Unit Number: " + unitNumber + "<br>\n" +
                "        Billing Month: " + bill.getBillingMonth() + "\n" +
                "      </td>\n" +
                "    </tr>\n" +
                "    <tr>\n" +
                "      <td>\n" +
                "        <strong>Statement Date:</strong> " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy")) + "<br>\n" +
                "        <strong>Due Date:</strong> " + bill.getDueDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy")) + "\n" +
                "      </td>\n" +
                "      <td style=\"text-align: right;\">\n" +
                "        <strong>Status:</strong><br>\n" +
                "        <span class=\"status-pill\">" + statusStr.replace("_", " ") + "</span>\n" +
                "      </td>\n" +
                "    </tr>\n" +
                "  </table>\n" +
                "\n" +
                "  <div class=\"section-title\">Statement Breakdown</div>\n" +
                "  <table class=\"invoice-table\">\n" +
                "    <thead>\n" +
                "      <tr>\n" +
                "        <th style=\"width: 25%;\">Type</th>\n" +
                "        <th style=\"width: 55%;\">Description</th>\n" +
                "        <th style=\"width: 20%; text-align: right;\">Amount</th>\n" +
                "      </tr>\n" +
                "    </thead>\n" +
                "    <tbody>\n" +
                "      " + chargesRows.toString() + "\n" +
                "    </tbody>\n" +
                "  </table>\n" +
                "\n" +
                "  <div class=\"summary-area\">\n" +
                "    <div class=\"summary-box\">\n" +
                "      <div class=\"summary-row\">\n" +
                "        <span>Total Billed Amount:</span>\n" +
                "        <span>" + String.format("₹%,.2f", bill.getTotalAmount()) + "</span>\n" +
                "      </div>\n" +
                "      <div class=\"summary-row\">\n" +
                "        <span>Total Amount Paid:</span>\n" +
                "        <span>" + String.format("₹%,.2f", amountPaid) + "</span>\n" +
                "      </div>\n" +
                "      <div class=\"summary-row total\">\n" +
                "        <span>Remaining Balance:</span>\n" +
                "        <span>" + String.format("₹%,.2f", remainingBalance) + "</span>\n" +
                "      </div>\n" +
                "    </div>\n" +
                "  </div>\n" +
                "\n" +
                "  " + transactionDetailsHtml + "\n" +
                "\n" +
                "  <div class=\"footer\">\n" +
                "    Thank you for choosing Living Ecosystem. This is a computer generated document and requires no physical signature.\n" +
                "  </div>\n" +
                "</body>\n" +
                "</html>";
    }
}
