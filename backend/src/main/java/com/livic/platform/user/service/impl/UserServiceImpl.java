package com.livic.platform.user.service.impl;

import com.livic.platform.common.util.PhoneNumbers;
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
    public UserDTOs.ProfileResponse updateProfile(UUID userId, UserDTOs.UpdateProfileRequest request) {
        UserTbl user = userQueryService.getUserById(userId);
        String phone = PhoneNumbers.normalize(request.phone());
        if (phone != null && !phone.equals(user.getPhoneNumber())) {
            userQueryService.findByPhoneNumber(phone)
                    .filter(other -> !other.getId().equals(userId))
                    .ifPresent(other -> {
                        throw new BusinessException(HttpStatus.CONFLICT, "Another account already uses this phone number");
                    });
            user.setPhoneNumber(phone);
            // A new number has not been confirmed yet.
            user.setPhoneVerifiedAt(null);
            userRepository.save(user);
        }
        return UserDTOs.ProfileResponse.from(user);
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
