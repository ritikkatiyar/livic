package com.livic.platform.user.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_device_token_tbl")
@AttributeOverrides({
    @AttributeOverride(name = "createdAt", column = @Column(name = "registered_at", nullable = false, updatable = false)),
    @AttributeOverride(name = "updatedAt", column = @Column(name = "last_seen_at", nullable = false))
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
public class UserDeviceTokenTbl extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "expo_push_token", nullable = false, unique = true)
    private String expoPushToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "platform", nullable = false)
    private DevicePlatform platform;

    @Builder
    public UserDeviceTokenTbl(UUID id, LocalDateTime registeredAt, LocalDateTime lastSeenAt, UUID userId, String expoPushToken, DevicePlatform platform) {
        this.setId(id);
        this.setCreatedAt(registeredAt != null ? registeredAt : LocalDateTime.now());
        this.setUpdatedAt(lastSeenAt != null ? lastSeenAt : LocalDateTime.now());
        this.userId = userId;
        this.expoPushToken = expoPushToken;
        this.platform = platform;
    }

    public LocalDateTime getRegisteredAt() {
        return getCreatedAt();
    }

    public void setRegisteredAt(LocalDateTime registeredAt) {
        this.setCreatedAt(registeredAt);
    }

    public LocalDateTime getLastSeenAt() {
        return getUpdatedAt();
    }

    public void setLastSeenAt(LocalDateTime lastSeenAt) {
        this.setUpdatedAt(lastSeenAt);
    }
}
