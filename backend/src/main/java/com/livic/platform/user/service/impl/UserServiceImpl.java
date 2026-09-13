package com.livic.platform.user.service.impl;

import com.livic.platform.common.domain.UserRole;
import com.livic.platform.common.exception.BusinessException;
import com.livic.platform.user.domain.UserTbl;
import com.livic.platform.user.dto.UserDTOs;
import com.livic.platform.user.service.interfaces.UserCrudService;
import com.livic.platform.user.service.interfaces.UserQueryService;
import com.livic.platform.user.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserCrudService userCrudService;
    private final UserQueryService userQueryService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserTbl createUser(UserTbl user) {
        String normalizedEmail = normalizeEmail(user.getAuthUid());
        if (userCrudService.findByAuthUid(normalizedEmail).isPresent()) {
            throw new BusinessException(HttpStatus.CONFLICT, "Email already registered");
        }
        return userCrudService.save(user);
    }

    @Override
    public UserTbl saveUser(UserTbl user) {
        return userCrudService.save(user);
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
        UserTbl saved = userCrudService.save(user);
        return UserDTOs.UserSearchResponse.from(saved);
    }

    @Override
    public UserDTOs.TenantProfileResponse updateTenantProfile(UserTbl user, UserDTOs.UpdateTenantProfileRequest request) {
        if (request.phone() != null && !request.phone().isBlank()) {
            user.setPhoneNumber(request.phone().trim());
            userCrudService.save(user);
        }
        return UserDTOs.TenantProfileResponse.from(user);
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
