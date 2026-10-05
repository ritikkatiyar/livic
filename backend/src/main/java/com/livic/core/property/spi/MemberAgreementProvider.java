package com.livic.core.property.spi;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Map;
import java.util.UUID;

/**
 * The agreement a vertical holds a unit member under: a lease in rental. Core shows it next to the
 * member and reads move-out dates from it without knowing what kind of agreement it is. Many members
 * have none (owners, family), and each implementation answers only for the members it knows.
 */
public interface MemberAgreementProvider {

    /** The agreements of those members that have one, keyed by member ID. */
    Map<UUID, MemberAgreement> agreementsByMemberIds(Collection<UUID> memberIds);

    /** {@code endDate} is the agreed move-out date, when one has been set. */
    record MemberAgreement(UUID id, BigDecimal monthlyAmount, LocalDate startDate, LocalDate endDate, String status) {
    }
}
