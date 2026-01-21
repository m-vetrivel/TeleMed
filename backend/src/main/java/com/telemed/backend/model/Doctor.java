package com.telemed.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "doctors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Links this Doctor profile to a Login User
    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String specialization;

    @Column(unique = true, nullable = false)
    private String licenseNumber;

    private Integer experienceYears;

    private Double consultationFee = 500.00;

    private Boolean isVerified = false; // Must be true to accept appointments
}