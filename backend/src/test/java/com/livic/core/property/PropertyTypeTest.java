package com.livic.core.property;

import com.livic.core.property.domain.PropertyType;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Core decides which product a property is run from; the stored mode is just that word. */
class PropertyTypeTest {

    @Test
    void ownerRunBuildingsAreResidentialAndTheRestRental() {
        assertThat(PropertyType.RESIDENTIAL.appMode()).isEqualTo("RESIDENTIAL");
        assertThat(PropertyType.SOCIETY.appMode()).isEqualTo("RESIDENTIAL");
        assertThat(PropertyType.RENTAL.appMode()).isEqualTo("RENTAL");
        assertThat(PropertyType.HOSTEL.appMode()).isEqualTo("RENTAL");
        assertThat(PropertyType.MESS.appMode()).isEqualTo("RENTAL");
        assertThat(PropertyType.INDIVIDUAL.appMode()).isEqualTo("RENTAL");
    }
}
