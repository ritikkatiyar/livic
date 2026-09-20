package com.livic.core.finance.controller;

import com.livic.platform.common.enums.ResourceType;
import com.livic.core.finance.service.interfaces.PaymentStatementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/rent-cycles")
@RequiredArgsConstructor
@Slf4j
public class InvoiceController {

    private final PaymentStatementService paymentStatementService;

    @GetMapping(value = "/{billId}/invoice", produces = MediaType.TEXT_HTML_VALUE)
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).BILL, #billId, 'LEASE_VIEW') or @authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).BILL, #billId, 'LEASE_VIEW_OWN')")
    public ResponseEntity<String> getPaymentStatementHtml(@PathVariable UUID billId) {
        log.info("API request: Get payment statement HTML for Bill: {}", billId);
        String html = paymentStatementService.generateStatementHtml(billId);
        return ResponseEntity.ok(html);
    }
}
