package com.livic.platform.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI 3 / Swagger UI. Interactive docs: {@code /swagger-ui.html}, JSON: {@code /v3/api-docs}.
 * <p>
 * Bearer security is declared per-operation (not global) so public auth and health routes show correctly in Swagger.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI tenantLivingOpenAPI() {
        return new OpenAPI()
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local (default dev port)")
                ))
                .info(new Info()
                        .title("Tenant Living API")
                        .description("""
                                ## Overview
                                Backend API for the Tenant Living property management system.

                                ## Authentication
                                - Obtain **`accessToken`** and **`refreshToken`** from **`POST /api/v1/auth/login`** or **`POST /api/v1/auth/signup`**.
                                - Call protected endpoints with header **`Authorization`** value **`Bearer`** followed by the access token.
                                - Rotate access with **`POST /api/v1/auth/refresh`** (send refresh token in JSON body).
                                - Introspect a JWT without calling a protected route: **`POST /api/v1/auth/validate`**.

                                ## Errors
                                Validation and business errors use **`application/json`** body **`ApiError`** (see schema).

                                ## Roles
                                | Role | Description |
                                |------|-------------|
                                | SUPER_ADMIN | Primary landlord |
                                | ADMIN | Co-owner / manager |
                                | PROPERTY_STAFF | Operations staff |
                                | USER | Tenant (default for self-signup) |
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Tenant Living Team")
                                .email("dev@tenantliving.com"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://tenantliving.com")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT access token from `POST /api/v1/auth/login` or `POST /api/v1/auth/signup`")));
    }
}
