package com.livic.core.finance.service.interfaces;

import java.util.UUID;

public interface PaymentStatementService {
    String generateStatementHtml(UUID billId);
}
