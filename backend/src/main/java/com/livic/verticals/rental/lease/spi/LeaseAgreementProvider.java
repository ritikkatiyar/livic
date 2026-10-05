package com.livic.verticals.rental.lease.spi;

import com.livic.core.property.spi.MemberAgreementProvider;
import com.livic.verticals.rental.lease.domain.LeaseTbl;
import com.livic.verticals.rental.lease.repository.LeaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/** A tenant member holds their unit under a lease; core shows it as the member's agreement. */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LeaseAgreementProvider implements MemberAgreementProvider {

    private final LeaseRepository leaseRepository;

    @Override
    public Map<UUID, MemberAgreement> agreementsByMemberIds(Collection<UUID> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) {
            return Map.of();
        }
        // Each lease has its own member, so a member has at most one lease.
        return leaseRepository.findByMemberIdIn(memberIds).stream()
                .collect(Collectors.toMap(LeaseTbl::getMemberId, LeaseAgreementProvider::toAgreement, (a, b) -> a));
    }

    private static MemberAgreement toAgreement(LeaseTbl lease) {
        return new MemberAgreement(
                lease.getId(),
                lease.getMonthlyRentAmount(),
                lease.getMoveInDate(),
                lease.getMoveOutDate(),
                lease.getStatus() != null ? lease.getStatus().name() : null
        );
    }
}
