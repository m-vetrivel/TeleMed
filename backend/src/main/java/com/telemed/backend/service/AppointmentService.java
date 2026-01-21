package com.telemed.backend.service;

import com.telemed.backend.dto.AppointmentRequest;
import com.telemed.backend.model.Appointment;
import com.telemed.backend.model.Doctor;
import com.telemed.backend.model.User;
import com.telemed.backend.model.enums.AppointmentStatus;
import com.telemed.backend.repository.AppointmentRepository;
import com.telemed.backend.repository.DoctorRepository;
import com.telemed.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import com.telemed.backend.model.enums.Role;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    @Transactional // Ensures data integrity
    public Appointment bookAppointment(AppointmentRequest request) {


        // --- FIX 1: Validate Date ---
        if (request.getStartTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot book appointments in the past!");
        }

        // --- VALIDATION FIX: End Time must be after Start Time ---
        if (request.getEndTime().isBefore(request.getStartTime())) {
            throw new RuntimeException("Error: End time cannot be before Start time!");
        }

        // 1. Get the current logged-in user (The Patient)
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User patient = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Get the Doctor
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        // 3. THE INTERVIEW WINNER: Check for Double Booking
        boolean isTaken = appointmentRepository.existsByDoctorAndDateRange(
                doctor.getId(), request.getStartTime(), request.getEndTime()
        );

        if (isTaken) {
            throw new RuntimeException("Slot is already booked! Please choose another time.");
        }

        // 4. Create & Save Appointment
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentTime(request.getStartTime());
        appointment.setEndTime(request.getEndTime());
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        // Generate a random WebRTC Meeting Link for later
        appointment.setMeetingLink("https://telemed.com/meet/" + UUID.randomUUID().toString());

        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getMyAppointments() {
        // 1. Who is logged in?
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Return data based on Role
        if (user.getRole() == Role.PATIENT) {
            return appointmentRepository.findByPatientId(user.getId());
        } else if (user.getRole() == Role.DOCTOR) {
            // Find the doctor profile associated with this login
            Doctor doctor = doctorRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Doctor profile not found"));
            return appointmentRepository.findByDoctorId(doctor.getId());
        } else {
            // Admin logic (optional)
            return List.of();
        }
    }
}