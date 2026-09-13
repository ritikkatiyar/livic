package com.livic.platform.auth.config;

import com.livic.platform.auth.service.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Email/password login: DAO provider + BCrypt. Owned by auth because only auth issues tokens.
 */
@Configuration
public class AuthenticationManagerConfig {

    @Bean
    public ProviderManager authenticationManager(CustomUserDetailsService customUserDetailsService,
                                                 PasswordEncoder passwordEncoder) {
        var provider = new DaoAuthenticationProvider(customUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }
}
