package com.livic.platform.user.repository;

import com.livic.platform.user.domain.UserDeviceTokenTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserDeviceTokenRepository extends JpaRepository<UserDeviceTokenTbl, UUID> {
    Optional<UserDeviceTokenTbl> findByExpoPushToken(String expoPushToken);
    List<UserDeviceTokenTbl> findByUserId(UUID userId);
}
