package com.telemed.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "doctors")
public class Doctor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    private String fullName;
    private String gender;

    // Updated: Supports comma separated values (e.g., "Cardiology, Neurology")
    private String specialization;

    private Integer experienceYears;
    private String licenseNumber;

    // --- NEW FIELDS ---
    private Double consultationFee;

    @Column(columnDefinition = "TEXT") // Allows long text for bio
    private String about;
}