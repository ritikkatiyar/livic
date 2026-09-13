package com.livic.platform.user.service.impl;

import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.service.interfaces.UserCrudService;
import com.livic.platform.user.service.interfaces.UserQueryService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserQueryServiceImpl implements UserQueryService {

    private final UserCrudService userCrudService;

    @Override
    public UserTbl getUserById(UUID id) {
        return userCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Override
    public UserTbl getUserByEmail(String email) {
        return userCrudService.findByAuthUid(normalizeEmail(email))
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Override
    public Optional<UserTbl> findByEmail(String email) {
        return userCrudService.findByAuthUid(normalizeEmail(email));
    }

    @Override
    public Optional<UserTbl> findByPhoneNumber(String phoneNumber) {
        return userCrudService.findByPhoneNumber(normalizePhoneNumber(phoneNumber));
    }

    @Override
    public boolean existsByEmail(String email) {
        return userCrudService.findByAuthUid(normalizeEmail(email)).isPresent();
    }

    @Override
    public Map<UUID, UserTbl> getUsersByIds(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) return Collections.emptyMap();
        return userCrudService.findAllById(ids).stream()
                .collect(Collectors.toMap(UserTbl::getId, u -> u));
    }

    @Override
    public List<UserTbl> searchByPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return userCrudService.findTop10ByPhoneNumberContaining(phoneNumber.trim());
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private static String normalizePhoneNumber(String phoneNumber) {
        return phoneNumber == null ? null : phoneNumber.trim();
    }
}
