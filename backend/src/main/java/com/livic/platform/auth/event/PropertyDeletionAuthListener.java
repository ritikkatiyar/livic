package com.livic.platform.auth.event;

import com.livic.platform.common.event.PropertyDeletionEvent;
import com.livic.platform.auth.repository.MembershipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class PropertyDeletionAuthListener {

    private final MembershipRepository membershipRepository;

    @EventListener
    @Transactional
    public void onPropertyDeleted(PropertyDeletionEvent event) {
        membershipRepository.deleteByPropertyId(event.getPropertyId());
    }
}
