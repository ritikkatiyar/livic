package com.livic.verticals.marketplace.exception;

import com.livic.platform.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

/** The verification code was created but the SMS gateway didn't accept it; answered as 503 so the user retries. */
public class OtpDeliveryException extends BusinessException {

    public OtpDeliveryException() {
        super(HttpStatus.SERVICE_UNAVAILABLE, "We couldn't send the verification code right now. Please try again in a minute.");
    }
}
