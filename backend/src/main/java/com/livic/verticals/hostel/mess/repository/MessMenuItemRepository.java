package com.livic.verticals.hostel.mess.repository;

import com.livic.verticals.hostel.mess.domain.MessMenuItemTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessMenuItemRepository extends JpaRepository<MessMenuItemTbl, UUID> {

    List<MessMenuItemTbl> findByPropertyIdOrderBySortOrderAsc(UUID propertyId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM MessMenuItemTbl i WHERE i.propertyId = :propertyId")
    int deleteByPropertyId(@Param("propertyId") UUID propertyId);
}
