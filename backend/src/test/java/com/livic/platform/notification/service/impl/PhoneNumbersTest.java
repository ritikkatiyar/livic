package com.livic.platform.notification.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class PhoneNumbersTest {

    @ParameterizedTest
    @ValueSource(strings = {"9876543210", "+91 98765 43210", "919876543210", "09876543210", "+91-98765-43210"})
    @DisplayName("Normalizes Indian mobile numbers to 91 plus 10 digits")
    void normalizes(String phone) {
        assertEquals(Optional.of("919876543210"), PhoneNumbers.toIndianMsisdn(phone));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "12345", "1234567890", "+1 415 555 0100", "98765432101"})
    @DisplayName("Rejects numbers that are not Indian mobiles")
    void rejects(String phone) {
        assertTrue(PhoneNumbers.toIndianMsisdn(phone).isEmpty());
    }

    @ParameterizedTest
    @CsvSource({"919876543210,******3210", "123,****"})
    @DisplayName("Masks all but the last four digits")
    void masks(String phone, String masked) {
        assertEquals(masked, PhoneNumbers.mask(phone));
    }
}
