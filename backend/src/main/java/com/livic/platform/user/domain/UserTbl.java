package com.livic.platform.user.domain;

import com.livic.platform.common.domain.BaseEntity;
import com.livic.platform.common.domain.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

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

    @Column(name = "phone_number", unique = true)
    private String phoneNumber;

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
