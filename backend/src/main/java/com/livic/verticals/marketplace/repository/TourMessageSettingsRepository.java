package com.livic.verticals.marketplace.repository;

import com.livic.verticals.marketplace.domain.TourMessageSettingsTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TourMessageSettingsRepository extends JpaRepository<TourMessageSettingsTbl, UUID> {

    Optional<TourMessageSettingsTbl> findByPropertyId(UUID propertyId);
}
