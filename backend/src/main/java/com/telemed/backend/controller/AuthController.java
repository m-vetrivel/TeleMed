package com.telemed.backend.controller;

import com.telemed.backend.dto.AuthenticationResponse; // Import DTO
import com.telemed.backend.dto.RegisterRequest;
import com.telemed.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.telemed.backend.dto.LoginRequest;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    // Changed String -> AuthenticationResponse
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    // Changed String -> AuthenticationResponse
    public ResponseEntity<AuthenticationResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/profile")
    public ResponseEntity<String> getMyProfile() {
        return ResponseEntity.ok("Hello! If you see this, you are logged in with a valid JWT!");
    }
}