package com.livic.auth.service;

import com.livic.security.UserDetailsImpl;
import com.livic.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserFacade userFacade;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Loading user by username: {}", username);

        return userFacade.findCredentialsByEmail(username)
                .map(credentials -> (UserDetails) UserDetailsImpl.forLogin(
                        credentials.id(),
                        credentials.email(),
                        credentials.passwordHash(),
                        credentials.fullName(),
                        credentials.lockoutUntil(),
                        credentials.globalRole()))
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));
    }
}
