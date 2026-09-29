package com.livic.platform.notification.exception;

public class NotificationSendException extends RuntimeException {

    /** Whether trying again may succeed (timeouts, gateway 5xx), as opposed to a rejected request. */
    private final boolean retryable;

    public NotificationSendException(String message, Throwable cause) {
        this(message, cause, false);
    }

    public NotificationSendException(String message, Throwable cause, boolean retryable) {
        super(message, cause);
        this.retryable = retryable;
    }

    public boolean isRetryable() {
        return retryable;
    }
}
