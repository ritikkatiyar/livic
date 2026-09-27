package com.livic.ai.client;

/** A backend call that failed; the message is safe to show the model and the user. */
public class BackendException extends RuntimeException {

    private final int status;

    public BackendException(int status, String message) {
        super(message);
        this.status = status;
    }

    public BackendException(String message, Throwable cause) {
        super(message, cause);
        this.status = 0;
    }

    /** HTTP status from the backend, or 0 when it could not be reached. */
    public int getStatus() {
        return status;
    }
}
