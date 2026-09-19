package com.livic.services.finance.controller;

import com.livic.platform.common.enums.ResourceType;
import com.livic.services.finance.service.interfaces.PaymentStatementService;
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

    @GetMapping(value = "/{rentCycleId}/invoice", produces = MediaType.TEXT_HTML_VALUE)
    @PreAuthorize("@authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).RENT_CYCLE, #rentCycleId, 'LEASE_VIEW') or @authorizationService.hasPermission(T(com.livic.platform.common.enums.ResourceType).RENT_CYCLE, #rentCycleId, 'LEASE_VIEW_OWN')")
    public ResponseEntity<String> getPaymentStatementHtml(@PathVariable UUID rentCycleId) {
        log.info("API request: Get payment statement HTML for RentCycle: {}", rentCycleId);
        String html = paymentStatementService.generateStatementHtml(rentCycleId);
        return ResponseEntity.ok(html);
    }
}
