package com.livic.platform.user.service.interfaces;

import com.livic.platform.user.domain.UserTbl;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface UserQueryService {
    UserTbl getUserById(UUID id);
    UserTbl getUserByEmail(String email);
    Optional<UserTbl> findByEmail(String email);
    Optional<UserTbl> findByPhoneNumber(String phoneNumber);
    List<UserTbl> searchByPhoneNumber(String phoneNumber);
    boolean existsByEmail(String email);
    Map<UUID, UserTbl> getUsersByIds(Collection<UUID> ids);
}
