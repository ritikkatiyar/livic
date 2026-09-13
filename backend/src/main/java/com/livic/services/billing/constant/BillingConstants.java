package com.livic.services.billing.constant;

public final class BillingConstants {

    private BillingConstants() {
        // Private constructor to prevent instantiation
    }

    public static final class SubscriptionStatus {
        public static final String ACTIVE = "ACTIVE";
        public static final String PENDING = "PENDING";
        public static final String PAST_DUE = "PAST_DUE";
        public static final String CANCELED = "CANCELED";
        public static final String TRIALING = "TRIALING";

        private SubscriptionStatus() {}
    }

    public static final class Cycle {
        public static final String MONTHLY = "MONTHLY";
        public static final String YEARLY = "YEARLY";

        private Cycle() {}
    }

    public static final class PlanKey {
        public static final String STARTER = "STARTER";
        public static final String BASIC = "BASIC";
        public static final String PREMIUM = "PREMIUM";
        public static final String ENTERPRISE = "ENTERPRISE";

        private PlanKey() {}
    }

    public static final class WalletTxType {
        public static final String CREDIT = "CREDIT";
        public static final String DEBIT = "DEBIT";

        private WalletTxType() {}
    }

    public static final class WalletReason {
        public static final String WALLET_TOPUP = "WALLET_TOPUP";

        private WalletReason() {}
    }

    public static final class Currency {
        public static final String INR = "INR";
        public static final String USD = "USD";
        public static final String DEFAULT_CURRENCY = INR;
        public static final double USD_TO_INR_EXCHANGE_RATE = 85.0;

        private Currency() {}
    }
}
