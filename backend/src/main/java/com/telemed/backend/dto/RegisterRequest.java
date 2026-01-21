package com.telemed.backend.dto;

import com.telemed.backend.model.enums.Role;
import lombok.Data;

@Data
public class RegisterRequest {
    private String fullName;
    private String email;
    private String password;
    private Role role; // PATIENT or DOCTOR

    // Optional fields for Doctors
    private String specialization;
    private String licenseNumber;
}