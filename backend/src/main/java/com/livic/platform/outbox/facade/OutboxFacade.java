package com.livic.platform.outbox.facade;

/**
 * Publishes an event to every {@link com.livic.platform.outbox.spi.OutboxConsumer} that wants it.
 * The event is stored in the caller's transaction, so consumers see it only if that commits, and see
 * it even if the process stops right after.
 */
public interface OutboxFacade {

    /** Must be called inside a transaction. */
    void publish(Object event);
}
