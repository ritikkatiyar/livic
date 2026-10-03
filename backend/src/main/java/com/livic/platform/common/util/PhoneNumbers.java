package com.livic.platform.common.util;

import com.livic.platform.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

import java.util.Optional;

/**
 * Phone numbers are stored and compared in E.164: a plus, the country code, the number. A number
 * typed without a country code is Indian, so 98765 43210, 098765-43210 and +91 98765 43210 are all
 * +919876543210.
 */
public final class PhoneNumbers {

    private static final String DEFAULT_COUNTRY_CODE = "91";

    private PhoneNumbers() {
    }

    /** The stored form of a number someone gave us; null when blank. Refuses (400) what is not a number. */
    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return tryNormalize(raw).orElseThrow(() ->
                new BusinessException(HttpStatus.BAD_REQUEST, "Enter a valid phone number, such as +91 98765 43210"));
    }

    /** The stored form, or empty when the text is not a whole phone number (a search still being typed). */
    public static Optional<String> tryNormalize(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        // Spaces, dashes and brackets are only how a number is written: "(+91) 98765-43210".
        String compact = raw.replaceAll("[\\s()-]", "");
        if (!compact.matches("\\+?[0-9]+")) {
            return Optional.empty();
        }
        String digits = compact.replace("+", "");
        if (compact.startsWith("+")) {
            return digits.length() >= 8 && digits.length() <= 15 ? Optional.of("+" + digits) : Optional.empty();
        }
        if (digits.length() == 10) {
            return Optional.of("+" + DEFAULT_COUNTRY_CODE + digits);
        }
        if (digits.length() == 11 && digits.startsWith("0")) {
            return Optional.of("+" + DEFAULT_COUNTRY_CODE + digits.substring(1));
        }
        if (digits.length() == 12 && digits.startsWith(DEFAULT_COUNTRY_CODE)) {
            return Optional.of("+" + digits);
        }
        return Optional.empty();
    }
}
