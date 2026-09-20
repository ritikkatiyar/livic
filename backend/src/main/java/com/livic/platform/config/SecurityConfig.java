package com.livic.platform.config;

import com.livic.platform.security.JwtAuthenticationFilter;
import com.livic.platform.security.JsonAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.expression.spel.support.StandardTypeLocator;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;

/**
 * Security: stateless JWT for API access; login uses DAO provider + BCrypt.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JsonAuthenticationEntryPoint jsonAuthenticationEntryPoint;

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            CorsConfigurationSource corsConfigurationSource
    ) throws Exception {
        // Insert an internal token filter before JWT processing to allow trusted services
        InternalServiceAuthFilter internalFilter = new InternalServiceAuthFilter();

        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .anonymous(anonymous -> anonymous.disable())
                .exceptionHandling(ex -> ex.authenticationEntryPoint(jsonAuthenticationEntryPoint))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS).permitAll()
                        // Landlord tour management lives under the marketplace prefix but is never public;
                        // these must be matched before the public marketplace rule below
                        .requestMatchers(
                                "/api/v1/marketplace/properties/*/tour-requests",
                                "/api/v1/marketplace/properties/*/tour-requests/**",
                                "/api/v1/marketplace/tour-requests/**",
                                "/api/v1/marketplace/properties/*/tour-availability",
                                "/api/v1/marketplace/properties/*/tour-blackouts",
                                "/api/v1/marketplace/tour-blackouts/**"
                        ).authenticated()
                        .requestMatchers(
                                "/api/v1/auth/**",
                                "/health",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/swagger-ui.html",
                                "/api/v1/billing/plans",
                                "/api/v1/billing/webhooks/**",
                                "/api/v1/payments/webhooks/**",
                                "/api/v1/marketplace/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(internalFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    static MethodSecurityExpressionHandler methodSecurityExpressionHandler() {
        DefaultMethodSecurityExpressionHandler handler = new DefaultMethodSecurityExpressionHandler();
        StandardTypeLocator locator = new StandardTypeLocator();
        locator.registerImport("com.livic.platform.common.enums");
        handler.setTypeLocator(locator);
        return handler;
    }

    // Simple internal auth filter that checks a pre-shared token header and grants ADMIN role.
    static class InternalServiceAuthFilter extends OncePerRequestFilter {

        private final String header = "Authorization";
        private final String expected;

        public InternalServiceAuthFilter() {
            this.expected = System.getenv().getOrDefault("APP_INTERNAL_AUTH_TOKEN", "");
        }

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                throws ServletException, IOException {
            String auth = request.getHeader(header);
            if (auth != null && !expected.isEmpty() && auth.equals("Bearer " + expected)) {
                var token = new UsernamePasswordAuthenticationToken(
                        "internal-service", null, AuthorityUtils.createAuthorityList("ROLE_ADMIN"));
                SecurityContextHolder.getContext().setAuthentication(token);
            }
            filterChain.doFilter(request, response);
        }
    }
}
