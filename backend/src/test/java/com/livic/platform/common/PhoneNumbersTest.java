package com.livic.platform.common;

import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.common.util.PhoneNumbers;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** One stored form per number, whichever way it is written; an Indian number may skip the country code. */
class PhoneNumbersTest {

    @Test
    void indianNumbersWrittenAnyWayAreTheSame() {
        for (String typed : new String[]{"9876543210", "98765 43210", "098765-43210", "919876543210", "+91 98765 43210", "+91-98765-43210", " (+91) 9876543210 "}) {
            assertThat(PhoneNumbers.normalize(typed)).as(typed).isEqualTo("+919876543210");
        }
    }

    @Test
    void otherCountriesKeepTheirCode() {
        assertThat(PhoneNumbers.normalize("+44 20 7946 0958")).isEqualTo("+442079460958");
    }

    @Test
    void blankIsNoNumber() {
        assertThat(PhoneNumbers.normalize(null)).isNull();
        assertThat(PhoneNumbers.normalize("  ")).isNull();
    }

    @Test
    void somethingElseIsRefusedOrNotLookedUp() {
        assertThatThrownBy(() -> PhoneNumbers.normalize("98765")).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> PhoneNumbers.normalize("call me")).isInstanceOf(BusinessException.class);
        assertThat(PhoneNumbers.tryNormalize("98765")).isEmpty();
        assertThat(PhoneNumbers.tryNormalize("tenant@example.com")).isEmpty();
    }
}
