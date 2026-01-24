package com.telemed.backend.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    // Core Auth
    private String email;
    private String password;
    private String role; // "PATIENT" or "DOCTOR"

    // Common Profile
    private String fullName;
    private String gender;

    // Patient Specific
    private String preExistingConditions;
    private String familyMedicalHistory;
    private String allergies;
    private String currentMedications;
    private String previousSurgeries;
    private String preferredDoctorGender;
    private String preferredLanguage;

    // Doctor Specific
    private String specialization;
    private Integer experienceYears;
    private String licenseNumber;
}