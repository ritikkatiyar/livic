package com.livic.features.announcement.service.interfaces;

import com.livic.features.announcement.domain.AnnouncementTbl;
import com.livic.platform.common.service.interfaces.CrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AnnouncementCrudService extends CrudService<AnnouncementTbl, UUID> {
    Page<AnnouncementTbl> findNoticesForTenant(UUID propertyId, Integer floor, UUID unitId, Pageable pageable);
    Page<AnnouncementTbl> findByPropertyId(UUID propertyId, Pageable pageable);
}
