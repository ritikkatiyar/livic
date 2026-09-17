package com.livic.platform.notification.service.impl;

import com.livic.platform.notification.dto.TemplatedMessage;
import com.livic.platform.notification.service.SmsProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Prints SMS to the application log instead of sending them. Active whenever MSG91 SMS is disabled, which the
 * startup check only allows outside production (msg91.sms.required).
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "msg91.sms", name = "enabled", havingValue = "false", matchIfMissing = true)
public class ConsoleSmsProvider implements SmsProvider {

    @Override
    public void send(String msisdn, TemplatedMessage message) {
        log.info("[SMS - not sent, console provider] to={} template={}: {}",
                PhoneNumbers.mask(msisdn), message.template(), message.render());
    }
}
