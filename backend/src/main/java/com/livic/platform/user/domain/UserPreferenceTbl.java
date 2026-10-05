package com.livic.platform.user.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "user_preference_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPreferenceTbl extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    /** Which product the apps open for the user, such as RENTAL or RESIDENTIAL; only the apps interpret it. */
    @Column(name = "active_mode", nullable = false, length = 20)
    private String activeMode;

    @Column(name = "onboarding_done", nullable = false)
    private boolean onboardingDone;
}
