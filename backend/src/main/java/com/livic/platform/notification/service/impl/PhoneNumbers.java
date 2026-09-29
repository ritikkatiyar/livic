package com.livic.platform.notification.service.impl;

import java.util.Optional;
import java.util.regex.Pattern;

/** Phone number handling for SMS delivery. */
final class PhoneNumbers {

    private static final Pattern INDIAN_MOBILE = Pattern.compile("[6-9][0-9]{9}");
    private static final int VISIBLE_DIGITS = 4;

    private PhoneNumbers() {
    }

    /**
     * Converts an Indian mobile number to gateway form (91 followed by 10 digits).
     * Accepts "9876543210", "+91 98765 43210", "919876543210" and "09876543210"; anything else is empty.
     */
    static Optional<String> toIndianMsisdn(String phone) {
        if (phone == null) {
            return Optional.empty();
        }
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.length() == 12 && digits.startsWith("91")) {
            digits = digits.substring(2);
        } else if (digits.length() == 11 && digits.startsWith("0")) {
            digits = digits.substring(1);
        }
        return INDIAN_MOBILE.matcher(digits).matches() ? Optional.of("91" + digits) : Optional.empty();
    }

    /** Keeps only the last four digits, for logs. */
    static String mask(String phone) {
        String digits = phone == null ? "" : phone.replaceAll("[^0-9]", "");
        if (digits.length() <= VISIBLE_DIGITS) {
            return "****";
        }
        return "******" + digits.substring(digits.length() - VISIBLE_DIGITS);
    }
}
