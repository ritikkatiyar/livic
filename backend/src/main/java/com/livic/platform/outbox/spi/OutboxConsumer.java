package com.livic.platform.outbox.spi;

/**
 * Implemented by a module that reacts to an event published through the outbox. Each consumer gets
 * its own copy of the event and its own transaction, so one consumer failing neither undoes the
 * publisher's work nor another consumer's, and it is retried on its own.
 *
 * @param <E> the event, a record that serializes to JSON
 */
public interface OutboxConsumer<E> {

    /** Stored on each waiting event; renaming a consumer strands the events still waiting for it. */
    String name();

    Class<E> eventType();

    /** Whether this consumer wants the event at all; decided when it is published. */
    default boolean accepts(E event) {
        return true;
    }

    /**
     * {@code IMMEDIATE} runs right after the publisher commits, in its thread, so the effect is
     * visible when the request returns (a paid bill). {@code BACKGROUND} is left to the poller, for
     * slow work the request should not wait on (sending messages).
     */
    default Delivery delivery() {
        return Delivery.IMMEDIATE;
    }

    /** Runs in a transaction of its own; throw to have the event retried later. */
    void handle(E event);

    enum Delivery { IMMEDIATE, BACKGROUND }
}
