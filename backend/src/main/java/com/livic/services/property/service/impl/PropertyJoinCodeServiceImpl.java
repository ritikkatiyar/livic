package com.livic.services.property.service.impl;

import com.livic.platform.auth.dto.MembershipSummaryDTO;
import com.livic.platform.auth.facade.AuthFacade;
import com.livic.platform.common.constant.StaffPermission;
import com.livic.platform.common.enums.AccessType;
import com.livic.platform.common.exception.BusinessException;
import com.livic.services.property.domain.PropertyJoinCodeTbl;
import com.livic.services.property.domain.PropertyTbl;
import com.livic.services.property.dto.PropertyJoinCodeDTOs;
import com.livic.services.property.mapper.PropertyJoinCodeMapper;
import com.livic.services.property.service.interfaces.PropertyJoinCodeCrudService;
import com.livic.services.property.service.interfaces.PropertyJoinCodeService;
import com.livic.services.property.service.interfaces.PropertyQueryService;
import com.livic.platform.user.domain.UserMode;
import com.livic.platform.user.dto.UserSummaryDTO;
import com.livic.platform.user.facade.UserFacade;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class PropertyJoinCodeServiceImpl implements PropertyJoinCodeService {

    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final PropertyJoinCodeCrudService propertyJoinCodeCrudService;
    private final PropertyQueryService propertyQueryService;
    private final AuthFacade authFacade;
    private final UserFacade userFacade;

    public PropertyJoinCodeServiceImpl(
            PropertyJoinCodeCrudService propertyJoinCodeCrudService,
            PropertyQueryService propertyQueryService,
            AuthFacade authFacade,
            UserFacade userFacade
    ) {
        this.propertyJoinCodeCrudService = propertyJoinCodeCrudService;
        this.propertyQueryService = propertyQueryService;
        this.authFacade = authFacade;
        this.userFacade = userFacade;
    }

    @Override
    public PropertyJoinCodeDTOs.JoinCodeResponse generateJoinCode(UUID propertyId, String title, AccessType accessType, Set<String> permissionCodes, int maxUses, UUID actorId) {
        PropertyTbl property = propertyQueryService.getPropertyById(propertyId);
        UserSummaryDTO actor = userFacade.getUserById(actorId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Actor user not found"));

        String effectiveTitle = title != null && !title.isBlank() ? title.trim() : "Member";
        AccessType effectiveAccessType = accessType != null ? accessType : AccessType.CUSTOM_ACCESS;

        Set<String> effectivePermissionCodes = (AccessType.CUSTOM_ACCESS.equals(effectiveAccessType) && permissionCodes != null)
                ? new HashSet<>(permissionCodes)
                : new HashSet<>();
        List<String> unknownCodes = effectivePermissionCodes.stream().filter(c -> !StaffPermission.isValid(c)).sorted().toList();
        if (!unknownCodes.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Unknown permission codes: " + String.join(", ", unknownCodes));
        }

        String code = generateRandomCode(property.getName(), effectiveTitle);
        while (propertyJoinCodeCrudService.findByCode(code).isPresent()) {
            code = generateRandomCode(property.getName(), effectiveTitle);
        }

        PropertyJoinCodeTbl joinCode = PropertyJoinCodeTbl.builder()
                .property(property)
                .title(effectiveTitle)
                .accessType(effectiveAccessType)
                .permissionCodes(effectivePermissionCodes)
                .code(code)
                .createdBy(actor.id())
                .maxUses(maxUses)
                .usesCount(0)
                .isActive(true)
                .expiresAt(Instant.now().plusSeconds(172800)) // 48 hours
                .build();

        PropertyJoinCodeTbl saved = propertyJoinCodeCrudService.save(joinCode);
        return PropertyJoinCodeMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PropertyJoinCodeDTOs.JoinCodeResponse> getPropertyJoinCodes(UUID propertyId, Pageable pageable) {
        Page<PropertyJoinCodeTbl> page = propertyJoinCodeCrudService.findByPropertyId(propertyId, pageable);
        return page.map(PropertyJoinCodeMapper::toResponse);
    }

    @Override
    public PropertyJoinCodeDTOs.JoinCodeResultResponse validateAndApplyJoinCode(String code, UUID userId) {
        String cleanCode = code != null ? code.trim().toUpperCase() : "";

        PropertyJoinCodeTbl joinCode = propertyJoinCodeCrudService.findByCode(cleanCode)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Invalid join code."));

        if (!joinCode.isActive()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Join code is inactive.");
        }

        if (joinCode.getExpiresAt().isBefore(Instant.now())) {
            joinCode.setActive(false);
            propertyJoinCodeCrudService.save(joinCode);
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Join code has expired.");
        }

        if (joinCode.getUsesCount() >= joinCode.getMaxUses()) {
            joinCode.setActive(false);
            propertyJoinCodeCrudService.save(joinCode);
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Join code has reached its maximum uses.");
        }

        PropertyTbl property = joinCode.getProperty();
        Set<String> permissionCodes = joinCode.getPermissionCodes() != null
                ? joinCode.getPermissionCodes()
                : Set.of();

        MembershipSummaryDTO saved = authFacade.createMembership(
                property.getId(),
                userId,
                joinCode.getTitle(),
                joinCode.getAccessType(),
                permissionCodes,
                joinCode.getCreatedBy()
        );

        // Mark onboarding done so user is not blocked by the onboarding gate
        userFacade.markOnboardingDone(userId, UserMode.RENTAL);

        joinCode.setUsesCount(joinCode.getUsesCount() + 1);
        if (joinCode.getUsesCount() >= joinCode.getMaxUses()) {
            joinCode.setActive(false);
        }
        propertyJoinCodeCrudService.save(joinCode);

        log.info("join_code_applied userId={} propertyId={} title={} accessType={} code={}",
                userId, property.getId(), joinCode.getTitle(), joinCode.getAccessType(), cleanCode);

        return PropertyJoinCodeMapper.toResultResponse(
                property.getId(),
                property.getName(),
                saved.title(),
                saved.accessType(),
                saved.id()
        );
    }

    private String generateRandomCode(String propertyName, String title) {
        String propAbbr = propertyName.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (propAbbr.length() > 4) propAbbr = propAbbr.substring(0, 4);
        String titleAbbr = title.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (titleAbbr.length() > 3) titleAbbr = titleAbbr.substring(0, 3);
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
        }
        return propAbbr + "-" + titleAbbr + "-" + sb.toString();
    }
}
