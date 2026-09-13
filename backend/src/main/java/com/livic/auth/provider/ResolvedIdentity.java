package com.livic.auth.provider;

/** Provider-neutral identity asserted by a verified external credential. */
public record ResolvedIdentity(
        String subject,
        String email,
        boolean emailVerified,
        String fullName
) {}
