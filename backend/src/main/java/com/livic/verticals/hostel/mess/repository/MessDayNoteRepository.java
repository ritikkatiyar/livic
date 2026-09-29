package com.livic.verticals.hostel.mess.repository;

import com.livic.verticals.hostel.mess.domain.MessDayNoteTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessDayNoteRepository extends JpaRepository<MessDayNoteTbl, UUID> {

    List<MessDayNoteTbl> findByPropertyId(UUID propertyId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM MessDayNoteTbl n WHERE n.propertyId = :propertyId")
    int deleteByPropertyId(@Param("propertyId") UUID propertyId);
}
