package com.telemed.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Apply to ALL endpoints
                .allowedOrigins("http://localhost:5173",
                        "http://127.0.0.1:5173","http://10.130.58.125:5173/","https://justa-preoccasioned-sharlene.ngrok-free.dev") // Allow YOUR React app
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Allow these actions
                .allowedHeaders("*") // Allow all headers (like Authorization)
                .allowCredentials(true); // Allow sending cookies/auth headers
    }
}