package com.livic.platform.auth.repository;

import com.livic.platform.auth.domain.RefreshTokenTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshTokenTbl, UUID> {

    Optional<RefreshTokenTbl> findByTokenHashAndRevokedIsFalse(String tokenHash);

    @Modifying
    @Query("update RefreshTokenTbl t set t.revoked = true where t.userId = :userId and t.revoked = false")
    int revokeAllByUserId(@Param("userId") UUID userId);
}
