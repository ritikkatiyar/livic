package com.livic.verticals.hostel.mess.repository;

import com.livic.verticals.hostel.mess.domain.MessMealSlotTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface MessMealSlotRepository extends JpaRepository<MessMealSlotTbl, UUID> {

    List<MessMealSlotTbl> findByPropertyIdOrderBySortOrderAsc(UUID propertyId);

    @Query("SELECT s.id FROM MessMealSlotTbl s WHERE s.propertyId = :propertyId")
    List<UUID> findIdsByPropertyId(@Param("propertyId") UUID propertyId);

    /** The slots' menu items go with them through the foreign key's ON DELETE CASCADE. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM MessMealSlotTbl s WHERE s.propertyId = :propertyId AND s.id IN :ids")
    int deleteByPropertyIdAndIdIn(@Param("propertyId") UUID propertyId, @Param("ids") Collection<UUID> ids);
}
