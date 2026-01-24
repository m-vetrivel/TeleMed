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
    private User user; // Links back to the login email/password

    private String fullName;
    private String gender;

    // Medical Details (Stored as Text/String for simplicity)
    @Column(columnDefinition = "TEXT")
    private String preExistingConditions;

    @Column(columnDefinition = "TEXT")
    private String familyMedicalHistory;

    private String allergies; // Comma separated
    private String currentMedications; // Comma separated

    @Column(columnDefinition = "TEXT")
    private String previousSurgeries;

    // Preferences
    private String preferredDoctorGender; // "Male", "Female", "No Preference"
    private String preferredLanguage;
}