package com.telemed.backend.controller;

import com.telemed.backend.model.Patient;
import com.telemed.backend.model.User;
import com.telemed.backend.repository.PatientRepository;
import com.telemed.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "http://localhost:5173")
public class PatientController {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<Patient> getMyProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        Patient patient = patientRepository.findByUser(user);
        // Return existing or empty object (to avoid null errors on frontend)
        return ResponseEntity.ok(patient != null ? patient : new Patient());
    }

    @PutMapping("/me")
    public ResponseEntity<Patient> updateMyProfile(@RequestBody Patient updatedInfo) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();

        Patient patient = patientRepository.findByUser(user);
        if (patient == null) {
            patient = new Patient();
            patient.setUser(user);
        }

        // --- 1. BASIC INFO ---
        patient.setFullName(updatedInfo.getFullName());
        patient.setAge(updatedInfo.getAge());
        patient.setGender(updatedInfo.getGender());
        patient.setBloodGroup(updatedInfo.getBloodGroup());
        patient.setWeight(updatedInfo.getWeight());
        patient.setHeight(updatedInfo.getHeight());

        // --- 2. CONTACT INFO ---
        patient.setPhoneNumber(updatedInfo.getPhoneNumber());
        patient.setAddress(updatedInfo.getAddress());

        // --- 3. MEDICAL DETAILS ---
        patient.setMedicalHistory(updatedInfo.getMedicalHistory()); // General
        patient.setPreExistingConditions(updatedInfo.getPreExistingConditions());
        patient.setFamilyMedicalHistory(updatedInfo.getFamilyMedicalHistory());
        patient.setAllergies(updatedInfo.getAllergies());
        patient.setCurrentMedications(updatedInfo.getCurrentMedications());
        patient.setPreviousSurgeries(updatedInfo.getPreviousSurgeries());

        // --- 4. PREFERENCES ---
        patient.setPreferredDoctorGender(updatedInfo.getPreferredDoctorGender());
        patient.setPreferredLanguage(updatedInfo.getPreferredLanguage());

        return ResponseEntity.ok(patientRepository.save(patient));
    }
}