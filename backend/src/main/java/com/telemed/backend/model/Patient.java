package com.telemed.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "patients")
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    // --- 1. BASIC INFO ---
    private String fullName;
    private String gender;
    private Integer age;       // From Set 1
    private String bloodGroup; // From Set 1
    private Integer weight;
    private Integer height;

    // --- 2. CONTACT INFO ---
    private String phoneNumber; // From Set 1
    private String address;     // From Set 1

    // --- 3. DETAILED MEDICAL HISTORY ---
    @Column(columnDefinition = "TEXT")
    private String medicalHistory; // General Summary (From Set 1)

    @Column(columnDefinition = "TEXT")
    private String preExistingConditions; // Specific (From Set 2)

    @Column(columnDefinition = "TEXT")
    private String familyMedicalHistory; // (From Set 2)

    private String allergies;         // (From Set 2)
    private String currentMedications; // (From Set 2)

    @Column(columnDefinition = "TEXT")
    private String previousSurgeries; // (From Set 2)

    // --- 4. PREFERENCES ---
    private String preferredDoctorGender; // (From Set 2)
    private String preferredLanguage;     // (From Set 2)
}