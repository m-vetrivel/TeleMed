package com.telemed.backend.service;

import com.telemed.backend.dto.AppointmentRequest;
import com.telemed.backend.model.Appointment;
import com.telemed.backend.model.Doctor;
import com.telemed.backend.model.Patient;
import com.telemed.backend.model.User;
import com.telemed.backend.model.enums.AppointmentStatus;
import com.telemed.backend.model.enums.Role;
import com.telemed.backend.repository.AppointmentRepository;
import com.telemed.backend.repository.DoctorRepository;
import com.telemed.backend.repository.PatientRepository;
import com.telemed.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;

    @Transactional
    public Appointment bookAppointment(AppointmentRequest request) {

        // --- FIX: Use .getAppointmentTime() instead of .getStartTime() ---
        if (request.getAppointmentTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot book appointments in the past!");
        }

        if (request.getEndTime().isBefore(request.getAppointmentTime())) {
            throw new RuntimeException("Error: End time cannot be before Start time!");
        }

        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Patient patient = patientRepository.findByUser(user);
        if (patient == null) {
            throw new RuntimeException("Patient profile not found! Are you logged in as a Doctor?");
        }

        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        // Create & Save Appointment
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);

        // --- FIX: Use .getAppointmentTime() here too ---
        appointment.setAppointmentTime(request.getAppointmentTime());

        appointment.setEndTime(request.getEndTime());
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        // This will work now because we updated the Entity
        appointment.setMeetingLink("https://telemed.com/meet/" + UUID.randomUUID().toString());

        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getMyAppointments() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == Role.PATIENT) {
            Patient patient = patientRepository.findByUser(user);
            return appointmentRepository.findByPatient(patient);
        } else if (user.getRole() == Role.DOCTOR) {
            Doctor doctor = doctorRepository.findByUser(user);
            return appointmentRepository.findByDoctor(doctor);
        } else {
            return List.of();
        }
    }
}