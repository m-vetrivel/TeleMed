package com.telemed.backend.model;

import com.telemed.backend.model.enums.AppointmentStatus;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    private LocalDateTime appointmentTime; // <--- This is the field name
    private LocalDateTime endTime;


    // --- ADD THIS MISSING FIELD ---
    private String meetingLink;
    // ------------------------------

    @Enumerated(EnumType.STRING)
    private AppointmentStatus status;
}