package com.livic.platform.notification.service.impl;

import com.livic.platform.common.service.impl.AbstractCrudService;
import com.livic.platform.notification.domain.NotificationChannel;
import com.livic.platform.notification.domain.NotificationLogTbl;
import com.livic.platform.notification.domain.NotificationStatus;
import com.livic.platform.notification.repository.NotificationLogRepository;
import com.livic.platform.notification.service.interfaces.NotificationLogCrudService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationLogCrudServiceImpl extends AbstractCrudService<NotificationLogTbl, UUID, NotificationLogRepository> implements NotificationLogCrudService {

    public NotificationLogCrudServiceImpl(NotificationLogRepository repository) {
        super(repository);
    }

    @Override
    public List<NotificationLogTbl> findByRecipientId(UUID recipientId) {
        return repository.findByRecipientId(recipientId);
    }

    @Override
    public List<NotificationLogTbl> findByStatus(NotificationStatus status) {
        return repository.findByStatus(status);
    }

    @Override
    public List<NotificationLogTbl> findByRecipientIdAndChannel(UUID recipientId, NotificationChannel channel) {
        return repository.findByRecipientIdAndChannel(recipientId, channel);
    }
}
