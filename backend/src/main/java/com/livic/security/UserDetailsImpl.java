package com.livic.security;

import com.livic.common.domain.UserRole;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Spring Security principal for the current user. Part of the security kernel:
 * depends only on {@code common}, so every module (and a future service) can use it.
 */
@Getter
public class UserDetailsImpl implements UserDetails {

    private final String id;
    private final String username;
    private final String password;
    private final String fullName;
    private final boolean enabled;
    private final boolean accountNonLocked;
    private final List<GrantedAuthority> authorities;

    private UserDetailsImpl(String id, String username, String password,
                           String fullName, boolean enabled,
                           boolean accountNonLocked,
                           List<GrantedAuthority> authorities) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.fullName = fullName;
        this.enabled = enabled;
        this.accountNonLocked = accountNonLocked;
        this.authorities = authorities;
    }

    /**
     * Principal used by DAO authentication at login. {@code username} is the normalized email.
     * Bearer access uses {@link #fromClaims} via {@link JwtAuthenticationFilter}.
     */
    public static UserDetailsImpl forLogin(UUID id, String email, String passwordHash, String fullName,
                                           Instant lockoutUntil, UserRole globalRole) {
        boolean accountNonLocked = lockoutUntil == null || !lockoutUntil.isAfter(Instant.now());
        return new UserDetailsImpl(
                id.toString(),
                email,
                passwordHash != null ? passwordHash : "",
                fullName,
                true,
                accountNonLocked,
                authoritiesFor(globalRole)
        );
    }

    public static UserDetailsImpl fromClaims(String id, String email, String role) {
        return new UserDetailsImpl(
                id,
                email,
                "", // Password not needed for token auth
                "", // Full name not strictly needed for auth filter
                true,
                true,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }

    private static List<GrantedAuthority> authoritiesFor(UserRole globalRole) {
        UserRole role = globalRole != null ? globalRole : UserRole.USER;
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    public boolean hasGlobalRole(String roleName) {
        return authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + roleName));
    }

    public String getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    /**
     * Returns the user ID as a {@link UUID}, avoiding repeated {@code UUID.fromString(getId())} calls.
     */
    public UUID getUuid() {
        return UUID.fromString(id);
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
