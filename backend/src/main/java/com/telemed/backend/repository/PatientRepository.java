package com.telemed.backend.repository;

import com.telemed.backend.model.Patient;
import com.telemed.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Patient findByUser(User user); // <--- Add this line
}