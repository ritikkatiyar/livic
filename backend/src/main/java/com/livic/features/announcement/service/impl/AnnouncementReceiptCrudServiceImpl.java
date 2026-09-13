package com.livic.features.announcement.service.impl;

import com.livic.features.announcement.domain.AnnouncementReceiptTbl;
import com.livic.features.announcement.repository.AnnouncementReceiptRepository;
import com.livic.features.announcement.service.interfaces.AnnouncementReceiptCrudService;
import com.livic.platform.common.service.impl.AbstractCrudService;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AnnouncementReceiptCrudServiceImpl extends AbstractCrudService<AnnouncementReceiptTbl, UUID, AnnouncementReceiptRepository> implements AnnouncementReceiptCrudService {

    public AnnouncementReceiptCrudServiceImpl(AnnouncementReceiptRepository repository) {
        super(repository);
    }

    @Override
    public Optional<AnnouncementReceiptTbl> findByAnnouncementIdAndUserId(UUID announcementId, UUID userId) {
        return repository.findByAnnouncementIdAndUserId(announcementId, userId);
    }

    @Override
    public boolean existsByAnnouncementIdAndUserId(UUID announcementId, UUID userId) {
        return repository.existsByAnnouncementIdAndUserId(announcementId, userId);
    }

    @Override
    public List<AnnouncementReceiptTbl> findByUserIdAndAnnouncementIdIn(UUID userId, Collection<UUID> announcementIds) {
        return repository.findByUserIdAndAnnouncementIdIn(userId, announcementIds);
    }

    @Override
    public long countByAnnouncementId(UUID announcementId) {
        return repository.countByAnnouncementId(announcementId);
    }

    @Override
    public List<Object[]> countReceiptsByAnnouncementIdIn(Collection<UUID> announcementIds) {
        return repository.countReceiptsByAnnouncementIdIn(announcementIds);
    }
}
