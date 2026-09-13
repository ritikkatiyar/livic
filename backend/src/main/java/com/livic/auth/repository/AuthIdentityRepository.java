package com.livic.auth.repository;

import com.livic.auth.domain.AuthIdentityTbl;
import com.livic.auth.provider.AuthProviderType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AuthIdentityRepository extends JpaRepository<AuthIdentityTbl, UUID> {
    Optional<AuthIdentityTbl> findByProviderAndProviderSubject(AuthProviderType provider, String providerSubject);
}
