package com.livic.verticals.marketplace.repository;

import com.livic.verticals.marketplace.domain.MarketplaceLeadTbl;
import com.livic.verticals.marketplace.domain.LeadStatus;
import com.livic.verticals.marketplace.domain.LeadType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface MarketplaceLeadRepository extends JpaRepository<MarketplaceLeadTbl, UUID> {

    Page<MarketplaceLeadTbl> findByPropertyId(UUID propertyId, Pageable pageable);



    Page<MarketplaceLeadTbl> findByStatus(LeadStatus status, Pageable pageable);

    /** Tour requests for one phone at one property in the given statuses (used for the one-active-tour rule). */
    List<MarketplaceLeadTbl> findByPropertyIdAndProspectPhoneAndLeadTypeAndStatusIn(
            UUID propertyId, String prospectPhone, LeadType leadType, Collection<LeadStatus> statuses);

    /** Whether the landlord already rejected this phone's tour at this property for a slot in [from, to). */
    @Query("SELECT COUNT(l) > 0 FROM MarketplaceLeadTbl l WHERE l.propertyId = :propertyId AND l.prospectPhone = :phone " +
           "AND l.leadType = com.livic.verticals.marketplace.domain.LeadType.TOUR_REQUEST " +
           "AND l.status = com.livic.verticals.marketplace.domain.LeadStatus.REJECTED " +
           "AND l.preferredSlot >= :from AND l.preferredSlot < :to")
    boolean existsRejectedTourInSlot(@Param("propertyId") UUID propertyId, @Param("phone") String phone,
                                     @Param("from") Instant from, @Param("to") Instant to);

    /** Upcoming slots the landlord rejected for this phone at this property, soonest first. */
    @Query("SELECT DISTINCT l.preferredSlot FROM MarketplaceLeadTbl l WHERE l.propertyId = :propertyId AND l.prospectPhone = :phone " +
           "AND l.leadType = com.livic.verticals.marketplace.domain.LeadType.TOUR_REQUEST " +
           "AND l.status = com.livic.verticals.marketplace.domain.LeadStatus.REJECTED " +
           "AND l.preferredSlot > :now ORDER BY l.preferredSlot ASC")
    List<Instant> findUpcomingRejectedTourSlots(@Param("propertyId") UUID propertyId, @Param("phone") String phone,
                                                @Param("now") Instant now);

    /** Visit times of pending and approved tours at a property in [from, to), for slot capacity. */
    @Query("SELECT l.preferredSlot FROM MarketplaceLeadTbl l WHERE l.propertyId = :propertyId " +
           "AND l.leadType = com.livic.verticals.marketplace.domain.LeadType.TOUR_REQUEST " +
           "AND l.status IN (com.livic.verticals.marketplace.domain.LeadStatus.NEW, com.livic.verticals.marketplace.domain.LeadStatus.APPROVED) " +
           "AND l.preferredSlot >= :from AND l.preferredSlot < :to")
    List<Instant> findActiveTourSlotsBetween(@Param("propertyId") UUID propertyId, @Param("from") Instant from, @Param("to") Instant to);

    /** All tour requests made from one phone, for the prospect's "My Requests" view. */
    Page<MarketplaceLeadTbl> findByProspectPhoneAndLeadType(String prospectPhone, LeadType leadType, Pageable pageable);

    /** Active tours in one status (pending or approved) whose visit is still ahead, soonest first. */
    @Query("SELECT l FROM MarketplaceLeadTbl l WHERE l.propertyId = :propertyId AND l.leadType = com.livic.verticals.marketplace.domain.LeadType.TOUR_REQUEST " +
           "AND l.status = :status AND l.preferredSlot > :now ORDER BY l.preferredSlot ASC")
    Page<MarketplaceLeadTbl> findUpcomingTours(@Param("propertyId") UUID propertyId, @Param("status") LeadStatus status,
                                               @Param("now") Instant now, Pageable pageable);

    /** Closed tours (decided, cancelled, or visit time passed), most recent visit first. */
    @Query("SELECT l FROM MarketplaceLeadTbl l WHERE l.propertyId = :propertyId AND l.leadType = com.livic.verticals.marketplace.domain.LeadType.TOUR_REQUEST " +
           "AND (l.status NOT IN (com.livic.verticals.marketplace.domain.LeadStatus.NEW, com.livic.verticals.marketplace.domain.LeadStatus.APPROVED) " +
           "OR l.preferredSlot <= :now) ORDER BY l.preferredSlot DESC")
    Page<MarketplaceLeadTbl> findPastTours(@Param("propertyId") UUID propertyId, @Param("now") Instant now, Pageable pageable);

    @Query("SELECT COUNT(l) FROM MarketplaceLeadTbl l WHERE l.propertyId = :propertyId AND l.leadType = com.livic.verticals.marketplace.domain.LeadType.TOUR_REQUEST " +
           "AND l.status = :status AND l.preferredSlot > :now")
    long countUpcomingTours(@Param("propertyId") UUID propertyId, @Param("status") LeadStatus status, @Param("now") Instant now);

    /** Approved tours starting within (now, until] whose reminder hasn't been handled, soonest first. */
    @Query("SELECT l FROM MarketplaceLeadTbl l WHERE l.leadType = com.livic.verticals.marketplace.domain.LeadType.TOUR_REQUEST " +
           "AND l.status = com.livic.verticals.marketplace.domain.LeadStatus.APPROVED AND l.reminderSentAt IS NULL " +
           "AND l.preferredSlot > :now AND l.preferredSlot <= :until ORDER BY l.preferredSlot ASC")
    List<MarketplaceLeadTbl> findToursDueForReminder(@Param("now") Instant now, @Param("until") Instant until, Pageable pageable);

    /**
     * Claims one tour's reminder; returns 1 for the caller that wins, 0 if another run already claimed it or the tour
     * is no longer approved. Doesn't bump the version: the reminder is bookkeeping and must not fail a concurrent
     * cancellation.
     */
    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE MarketplaceLeadTbl l SET l.reminderSentAt = :now WHERE l.id = :id AND l.reminderSentAt IS NULL " +
           "AND l.status = com.livic.verticals.marketplace.domain.LeadStatus.APPROVED")
    int claimReminder(@Param("id") UUID id, @Param("now") Instant now);

    /** Bulk lifecycle transition for tours whose visit time has passed (NEW -> EXPIRED, APPROVED -> COMPLETED). */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE MarketplaceLeadTbl l SET l.status = :to, l.version = l.version + 1, l.updatedAt = :updatedAt " +
           "WHERE l.leadType = com.livic.verticals.marketplace.domain.LeadType.TOUR_REQUEST AND l.status = :from AND l.preferredSlot <= :now")
    int closePastTours(@Param("from") LeadStatus from, @Param("to") LeadStatus to,
                       @Param("now") Instant now, @Param("updatedAt") LocalDateTime updatedAt);
}
