package com.livic.verticals.marketplace.repository;

import com.livic.verticals.marketplace.domain.TourBlackoutTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TourBlackoutRepository extends JpaRepository<TourBlackoutTbl, UUID> {

    List<TourBlackoutTbl> findByPropertyIdAndBlackoutDateBetweenOrderByBlackoutDateAscStartTimeAsc(
            UUID propertyId, LocalDate from, LocalDate to);

    List<TourBlackoutTbl> findByPropertyIdAndBlackoutDateGreaterThanEqualOrderByBlackoutDateAscStartTimeAsc(
            UUID propertyId, LocalDate from);
}
