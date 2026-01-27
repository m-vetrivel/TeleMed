package com.telemed.backend.controller;

import com.telemed.backend.dto.AppointmentRequest;
import com.telemed.backend.model.Appointment;
import com.telemed.backend.model.Doctor;
import com.telemed.backend.model.Patient;
import com.telemed.backend.model.User;
import com.telemed.backend.model.enums.AppointmentStatus;
import com.telemed.backend.repository.AppointmentRepository;
import com.telemed.backend.repository.DoctorRepository;
import com.telemed.backend.repository.PatientRepository;
import com.telemed.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "http://localhost:5173") // Allow React to access
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    // 1. Book an Appointment (POST)
    @PostMapping
    public ResponseEntity<?> createAppointment(@RequestBody AppointmentRequest request) {
        // 1. Get User/Doctor (Existing logic...)
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User patientUser = userRepository.findByEmail(email).orElseThrow();
        Patient patient = patientRepository.findByUser(patientUser);

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        // --- 2. NEW: CHECK FOR OVERLAP ---
        // Convert String/ISO to LocalDateTime if needed, or use request objects directly
        LocalDateTime start =request.getAppointmentTime();
        LocalDateTime end = request.getEndTime();

        boolean hasConflict = appointmentRepository.existsByDoctorAndDateRange(
                doctor.getId(),
                start,
                end
        );

        if (hasConflict) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Error: This time slot is already booked. Please choose another time.");
        }
        // Create Appointment
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentTime(request.getAppointmentTime());
        appointment.setEndTime(request.getEndTime());

        appointment.setStatus(AppointmentStatus.SCHEDULED); // Default status

        appointmentRepository.save(appointment);

        return ResponseEntity.ok("Appointment Booked Successfully!");
    }

    // 2. Get My Appointments (GET)
    @GetMapping
    public List<Appointment> getMyAppointments() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        // If Doctor, return doctor's appointments
        if (user.getRole().name().equals("DOCTOR")) {
            Doctor doctor = doctorRepository.findByUser(user);
            return appointmentRepository.findByDoctor(doctor);
        }

        // If Patient, return patient's appointments
        Patient patient = patientRepository.findByUser(user);
        return appointmentRepository.findByPatient(patient);
    }
}