package com.livic.services.finance.service.interfaces;

import java.util.UUID;

public interface PaymentStatementService {
    String generateStatementHtml(UUID rentCycleId);
}
