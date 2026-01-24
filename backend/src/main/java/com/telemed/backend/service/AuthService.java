package com.telemed.backend.service;

import com.telemed.backend.dto.AuthenticationResponse;
import com.telemed.backend.dto.LoginRequest;
import com.telemed.backend.dto.RegisterRequest;
import com.telemed.backend.model.Doctor;
import com.telemed.backend.model.Patient;
import com.telemed.backend.model.User;
import com.telemed.backend.model.enums.Role;
import com.telemed.backend.repository.DoctorRepository;
import com.telemed.backend.repository.PatientRepository;
import com.telemed.backend.repository.UserRepository;
import com.telemed.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthenticationResponse register(RegisterRequest request) {
        var user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(Role.valueOf(request.getRole().toUpperCase())) // Uppercase safety
                .build();

        User savedUser = userRepository.save(user);

        if (request.getRole().equalsIgnoreCase("PATIENT")) {
            Patient patient = new Patient();
            patient.setUser(savedUser);
            patient.setFullName(request.getFullName());
            patient.setGender(request.getGender());
            patient.setPreExistingConditions(request.getPreExistingConditions());
            patient.setFamilyMedicalHistory(request.getFamilyMedicalHistory());
            patient.setAllergies(request.getAllergies());
            patient.setCurrentMedications(request.getCurrentMedications());
            patient.setPreviousSurgeries(request.getPreviousSurgeries());
            patient.setPreferredDoctorGender(request.getPreferredDoctorGender());
            patient.setPreferredLanguage(request.getPreferredLanguage());
            patientRepository.save(patient);
        } else if (request.getRole().equalsIgnoreCase("DOCTOR")) {
            Doctor doctor = new Doctor();
            doctor.setUser(savedUser);
            doctor.setFullName(request.getFullName());
            doctor.setGender(request.getGender());
            doctor.setSpecialization(request.getSpecialization());
            doctor.setExperienceYears(request.getExperienceYears());
            doctor.setLicenseNumber(request.getLicenseNumber());
            doctorRepository.save(doctor);
        }

        // RED LINE GONE: Now calls generateToken(UserDetails)
        var jwtToken = jwtService.generateToken(savedUser);
        return AuthenticationResponse.builder().token(jwtToken).build();
    }

    public AuthenticationResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // RED LINE GONE: Now calls generateToken(UserDetails)
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder().token(jwtToken).build();
    }
}