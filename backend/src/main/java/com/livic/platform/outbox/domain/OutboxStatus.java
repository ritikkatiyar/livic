package com.livic.platform.outbox.domain;

public enum OutboxStatus {
    /** Not delivered yet, or waiting for its next attempt. */
    PENDING,
    DONE,
    /** Gave up after the last attempt; needs someone to look at {@code last_error}. */
    FAILED
}
