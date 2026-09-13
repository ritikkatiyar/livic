package com.livic.platform.auth.repository;

import com.livic.platform.auth.domain.AuthIdentityTbl;
import com.livic.platform.auth.provider.AuthProviderType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AuthIdentityRepository extends JpaRepository<AuthIdentityTbl, UUID> {
    Optional<AuthIdentityTbl> findByProviderAndProviderSubject(AuthProviderType provider, String providerSubject);
}
