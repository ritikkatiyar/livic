package com.livic.platform.payment.dto;

public record PaymentVerificationRequest(
        String razorpayPaymentId,
        String razorpayOrderId,
        String razorpaySignature
) {}
