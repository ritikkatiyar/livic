package com.livic.platform.user.domain;

import com.livic.platform.common.domain.BaseEntity;
import com.livic.platform.common.domain.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "user_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTbl extends BaseEntity {
    @Column(name = "auth_uid", unique = true, nullable = false)
    private String authUid;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    /** E.164, see {@link com.livic.platform.common.util.PhoneNumbers}. */
    @Column(name = "phone_number", unique = true)
    private String phoneNumber;

    /** When a code sent to {@code phoneNumber} was last confirmed; cleared when the number changes. Not required yet. */
    @Column(name = "phone_verified_at")
    private java.time.LocalDateTime phoneVerifiedAt;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private boolean emailVerified = true;

    @Column(name = "failed_login_attempts", nullable = false)
    private int failedLoginAttempts;

    @Column(name = "lockout_until")
    private Instant lockoutUntil;

    @Enumerated(EnumType.STRING)
    @Column(name = "global_role", nullable = false)
    @Builder.Default
    private UserRole globalRole = UserRole.USER;
}
