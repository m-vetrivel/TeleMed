package com.telemed.backend.service;

import com.telemed.backend.dto.RegisterRequest;
import com.telemed.backend.model.Doctor;
import com.telemed.backend.model.User;
import com.telemed.backend.model.enums.Role;
import com.telemed.backend.repository.DoctorRepository; // We will make this next
import com.telemed.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.telemed.backend.dto.LoginRequest;
import com.telemed.backend.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager; // Red line? See note below.
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository; // Add this repository
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public String register(RegisterRequest request) {
        // 1. Check if email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        // 2. Create the User (Common for Patient & Doctor)
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());

        User savedUser = userRepository.save(user);

        // 3. If User is a DOCTOR, save the extra Doctor details
        if (request.getRole() == Role.DOCTOR) {
            Doctor doctor = new Doctor();
            doctor.setUser(savedUser);
            doctor.setSpecialization(request.getSpecialization());
            doctor.setLicenseNumber(request.getLicenseNumber());
            doctor.setIsVerified(false); // Doctors need admin approval
            doctorRepository.save(doctor);
        }

        return "User registered successfully!";
    }

    public String login(LoginRequest request) {
        // 1. Authenticate (Check password)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // 2. Fetch the User object to get their Role
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 3. Generate Token WITH the Role
        return jwtService.generateToken(user.getEmail(), user.getRole().name());
    }
}