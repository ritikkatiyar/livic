package com.livic.features.announcement.service;

import com.livic.features.announcement.domain.AnnouncementTargetType;
import com.livic.features.announcement.domain.AnnouncementTbl;
import com.livic.features.announcement.repository.AnnouncementRepository;
import com.livic.features.announcement.service.interfaces.AnnouncementCrudService;
import com.livic.platform.common.service.impl.AbstractCrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class AnnouncementCrudServiceImpl extends AbstractCrudService<AnnouncementTbl, UUID, AnnouncementRepository> implements AnnouncementCrudService {

    public AnnouncementCrudServiceImpl(AnnouncementRepository announcementRepository) {
        super(announcementRepository);
    }

    @Override
    public Page<AnnouncementTbl> findNoticesForTenant(UUID propertyId, Integer floor, UUID unitId, Pageable pageable) {
        return repository.findNoticesForTenant(
            propertyId, floor, unitId,
            AnnouncementTargetType.PROPERTY, AnnouncementTargetType.FLOOR, AnnouncementTargetType.UNIT,
            pageable
        );
    }

    @Override
    public Page<AnnouncementTbl> findByPropertyId(UUID propertyId, Pageable pageable) {
        return repository.findByPropertyId(propertyId, pageable);
    }
}
