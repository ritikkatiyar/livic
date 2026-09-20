package com.livic.platform.payment.constant;

public final class PaymentConstants {

    private PaymentConstants() {
        // Private constructor to prevent instantiation
    }

    public static final class Method {
        public static final String ONLINE = "ONLINE";
        public static final String CASH = "CASH";
        public static final String BANK_TRANSFER = "BANK_TRANSFER";

        private Method() {}
    }

    public static final class ReferenceType {
        public static final String BILL = "BILL";
        public static final String SAAS_SUBSCRIPTION = "SAAS_SUBSCRIPTION";
        public static final String WALLET_TOPUP = "WALLET_TOPUP";
        public static final String UNIT_BOOKING = "UNIT_BOOKING";

        private ReferenceType() {}
    }

    public static final class Status {
        public static final String INITIATED = "INITIATED";
        public static final String PENDING_CONFIRMATION = "PENDING_CONFIRMATION";
        public static final String SUCCESS = "SUCCESS";
        public static final String FAILED = "FAILED";
        public static final String REJECTED = "REJECTED";

        private Status() {}
    }

    public static final class Currency {
        public static final String INR = "INR";

        private Currency() {}
    }

    public static final class Gateway {
        public static final String RAZORPAY = "RAZORPAY";
        public static final String CASH = "CASH";
        public static final String STRIPE = "STRIPE";

        private Gateway() {}
    }
}
