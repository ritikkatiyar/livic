package com.livic.platform.user.service.impl;

import com.livic.platform.common.util.PhoneNumbers;
import com.livic.platform.user.repository.UserRepository;
import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.dto.UserDTOs;
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

    private final UserRepository userRepository;

    @Override
    public UserTbl getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Override
    public UserDTOs.ProfileResponse getProfile(UUID userId) {
        return UserDTOs.ProfileResponse.from(getUserById(userId));
    }

    @Override
    public UserTbl getUserByEmail(String email) {
        return userRepository.findByAuthUid(normalizeEmail(email))
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Override
    public Optional<UserTbl> findByEmail(String email) {
        return userRepository.findByAuthUid(normalizeEmail(email));
    }

    @Override
    public Optional<UserTbl> findByPhoneNumber(String phoneNumber) {
        // A number that is not whole yet (still being typed) matches nobody.
        return PhoneNumbers.tryNormalize(phoneNumber).flatMap(userRepository::findByPhoneNumber);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.findByAuthUid(normalizeEmail(email)).isPresent();
    }

    @Override
    public Map<UUID, UserTbl> getUsersByIds(Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) return Collections.emptyMap();
        return userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(UserTbl::getId, u -> u));
    }

    @Override
    public List<UserDTOs.UserSearchResponse> lookupByPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return findByPhoneNumber(phoneNumber).stream()
                .map(UserDTOs.UserSearchResponse::from)
                .toList();
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

}
