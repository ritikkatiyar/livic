package com.livic.core.community.announcement;

import com.livic.core.community.announcement.domain.AnnouncementReceiptTbl;
import com.livic.core.community.announcement.domain.AnnouncementTbl;
import com.livic.core.community.announcement.repository.AnnouncementReceiptRepository;
import com.livic.core.community.announcement.repository.AnnouncementRepository;
import com.livic.core.community.announcement.service.impl.AnnouncementServiceImpl;
import com.livic.core.property.domain.UnitMemberRole;
import com.livic.core.property.dto.UnitResidentDTO;
import com.livic.core.property.facade.UnitMemberFacade;
import com.livic.platform.auth.service.interfaces.AuthorizationService;
import com.livic.platform.common.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AnnouncementReadReceiptTest {

    @Mock
    private AnnouncementRepository announcementRepository;
    @Mock
    private AnnouncementReceiptRepository announcementReceiptRepository;
    @Mock
    private UnitMemberFacade unitMemberFacade;
    @Mock
    private AuthorizationService authorizationService;

    @InjectMocks
    private AnnouncementServiceImpl announcementService;

    private final UUID propertyId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private AnnouncementTbl announcement;

    @BeforeEach
    void setUp() {
        announcement = AnnouncementTbl.builder().propertyId(propertyId).build();
        announcement.setId(UUID.randomUUID());
        when(announcementRepository.findById(announcement.getId())).thenReturn(Optional.of(announcement));
    }

    @Test
    @DisplayName("Someone who neither lives in nor manages the property cannot mark its notice read")
    void outsiderCannotMarkRead() {
        when(unitMemberFacade.getActiveResidencesByUserId(userId)).thenReturn(List.of());
        when(authorizationService.hasAnyPermission(eq(propertyId), anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> announcementService.markAsRead(announcement.getId(), userId))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        verify(announcementReceiptRepository, never()).save(any());
    }

    @Test
    @DisplayName("A resident's read is recorded once")
    void residentReadIsRecorded() {
        when(unitMemberFacade.getActiveResidencesByUserId(userId)).thenReturn(List.of(residenceIn(propertyId)));

        announcementService.markAsRead(announcement.getId(), userId);

        verify(announcementReceiptRepository).save(any(AnnouncementReceiptTbl.class));
    }

    @Test
    @DisplayName("A second tap that races the first is absorbed instead of failing the request")
    void racingDuplicateIsAbsorbed() {
        when(unitMemberFacade.getActiveResidencesByUserId(userId)).thenReturn(List.of(residenceIn(propertyId)));
        when(announcementReceiptRepository.save(any(AnnouncementReceiptTbl.class)))
                .thenThrow(new DataIntegrityViolationException("uq_announcement_user"));

        assertThatCode(() -> announcementService.markAsRead(announcement.getId(), userId)).doesNotThrowAnyException();
    }

    private UnitResidentDTO residenceIn(UUID propertyId) {
        return new UnitResidentDTO(UUID.randomUUID(), userId, UnitMemberRole.TENANT, UUID.randomUUID(), UUID.randomUUID(), "101", 1, propertyId);
    }
}
