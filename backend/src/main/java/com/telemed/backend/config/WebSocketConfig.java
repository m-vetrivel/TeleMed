package com.telemed.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 1. Keep this for legacy compatibility (optional)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // 2. ADD THIS: Standard WebSocket endpoint for React
        registry.addEndpoint("/ws-raw")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 2. Prefix for messages sent FROM client TO server
        registry.setApplicationDestinationPrefixes("/app");

        // 3. Prefix for messages sent FROM server TO client
        // "/user" is for private messages (Doctor <-> Patient)
        registry.enableSimpleBroker("/user");

        // 4. Handle "Specific User" routing
        registry.setUserDestinationPrefix("/user");
    }
}