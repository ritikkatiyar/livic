package com.livic.verticals.marketplace.domain;

import com.livic.platform.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** The channels a property uses for each tour message. Absent row = every channel on. */
@Entity
@Table(name = "tour_message_settings_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourMessageSettingsTbl extends BaseEntity {

    @Column(name = "property_id", nullable = false, unique = true)
    private UUID propertyId;

    @Column(name = "decision_sms", nullable = false)
    private boolean decisionSms;

    @Column(name = "decision_whatsapp", nullable = false)
    private boolean decisionWhatsapp;

    @Column(name = "reminder_sms", nullable = false)
    private boolean reminderSms;

    @Column(name = "reminder_whatsapp", nullable = false)
    private boolean reminderWhatsapp;

    @Column(name = "updated_by_user_id")
    private UUID updatedByUserId;
}
