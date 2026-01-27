package com.telemed.backend.controller;

import com.telemed.backend.model.Appointment;
import com.telemed.backend.model.Doctor;
import com.telemed.backend.model.User;
import com.telemed.backend.repository.AppointmentRepository;
import com.telemed.backend.repository.DoctorRepository;
import com.telemed.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "https://justa-preoccasioned-sharlene.ngrok-free.dev")
public class DoctorController {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    // --- PUBLIC: For Patient Dashboard ---
    @GetMapping
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Doctor> getDoctorById(@PathVariable Long id) {
        return doctorRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- SECURED: For Doctor Dashboard ---

    // 1. Get My Profile
    @GetMapping("/me")
    public ResponseEntity<Doctor> getMyProfile() {
        User user = getAuthenticatedUser();
        Doctor doctor = doctorRepository.findByUser(user);
        return ResponseEntity.ok(doctor);
    }

    // 2. Update My Profile
    @PutMapping("/me")
    public ResponseEntity<Doctor> updateMyProfile(@RequestBody Doctor updatedInfo) {
        User user = getAuthenticatedUser();
        Doctor doctor = doctorRepository.findByUser(user);

        if (doctor == null) return ResponseEntity.notFound().build();

        // Update EXISTING fields
        doctor.setFullName(updatedInfo.getFullName());
        doctor.setSpecialization(updatedInfo.getSpecialization());
        doctor.setExperienceYears(updatedInfo.getExperienceYears());
        doctor.setLicenseNumber(updatedInfo.getLicenseNumber());

        // --- UPDATE NEW FIELDS ---
        doctor.setConsultationFee(updatedInfo.getConsultationFee());
        doctor.setAbout(updatedInfo.getAbout());

        return ResponseEntity.ok(doctorRepository.save(doctor));
    }

    // 3. Get My Appointments
    @GetMapping("/appointments")
    public List<Appointment> getMyAppointments() {
        User user = getAuthenticatedUser();
        Doctor doctor = doctorRepository.findByUser(user);
        return appointmentRepository.findByDoctor(doctor);
    }

    // --- HELPER ---
    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }
}