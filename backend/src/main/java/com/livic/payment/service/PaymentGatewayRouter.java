package com.livic.payment.service;

import com.livic.payment.dto.PaymentGatewayType;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PaymentGatewayRouter {
    private final Map<PaymentGatewayType, PaymentGatewayService> services;

    public PaymentGatewayRouter(List<PaymentGatewayService> gatewayServices) {
        this.services = gatewayServices.stream()
            .collect(Collectors.toMap(PaymentGatewayService::getSupportedGateway, Function.identity()));
    }

    public PaymentGatewayService getGateway(PaymentGatewayType gatewayType) {
        PaymentGatewayService service = services.get(gatewayType);
        if (service == null) {
            throw new IllegalArgumentException("Unsupported payment gateway: " + gatewayType);
        }
        return service;
    }
}
