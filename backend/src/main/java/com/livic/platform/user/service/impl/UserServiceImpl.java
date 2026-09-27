package com.livic.platform.user.service.impl;

import com.livic.platform.user.repository.UserDeviceTokenRepository;
import com.livic.platform.user.repository.UserRepository;
import com.livic.platform.common.domain.UserRole;
import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.user.domain.DevicePlatform;
import com.livic.platform.user.domain.UserDeviceTokenTbl;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.dto.UserDTOs;
import com.livic.platform.user.service.interfaces.UserQueryService;
import com.livic.platform.user.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserDeviceTokenRepository userDeviceTokenRepository;
    private final UserQueryService userQueryService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserTbl createUser(UserTbl user) {
        String normalizedEmail = normalizeEmail(user.getAuthUid());
        if (userRepository.findByAuthUid(normalizedEmail).isPresent()) {
            throw new BusinessException(HttpStatus.CONFLICT, "Email already registered");
        }
        return userRepository.save(user);
    }


    @Override
    public UserDTOs.UserSearchResponse createTenant(UserDTOs.CreateTenantRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userQueryService.existsByEmail(email)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Email already registered");
        }
        String phone = request.phoneNumber().trim();
        if (userQueryService.findByPhoneNumber(phone).isPresent()) {
            throw new BusinessException(HttpStatus.CONFLICT, "Phone number already registered");
        }
        UserTbl user = UserTbl.builder()
                .authUid(email)
                .fullName(request.fullName().trim())
                .phoneNumber(phone)
                .passwordHash(passwordEncoder.encode(phone))
                .globalRole(UserRole.USER)
                .build();
        UserTbl saved = userRepository.save(user);
        return UserDTOs.UserSearchResponse.from(saved);
    }

    @Override
    public UserDTOs.TenantProfileResponse updateTenantProfile(UUID userId, UserDTOs.UpdateTenantProfileRequest request) {
        UserTbl user = userQueryService.getUserById(userId);
        if (request.phone() != null && !request.phone().isBlank()) {
            user.setPhoneNumber(request.phone().trim());
            userRepository.save(user);
        }
        return UserDTOs.TenantProfileResponse.from(user);
    }

    @Override
    public void registerDeviceToken(UUID userId, String expoPushToken, DevicePlatform platform) {
        Optional<UserDeviceTokenTbl> existingOpt = userDeviceTokenRepository.findByExpoPushToken(expoPushToken);
        if (existingOpt.isPresent()) {
            UserDeviceTokenTbl token = existingOpt.get();
            token.setUserId(userId);
            token.setPlatform(platform);
            token.setLastSeenAt(LocalDateTime.now());
            userDeviceTokenRepository.save(token);
        } else {
            UserDeviceTokenTbl token = UserDeviceTokenTbl.builder()
                    .userId(userId)
                    .expoPushToken(expoPushToken)
                    .platform(platform)
                    .registeredAt(LocalDateTime.now())
                    .lastSeenAt(LocalDateTime.now())
                    .build();
            userDeviceTokenRepository.save(token);
        }
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
