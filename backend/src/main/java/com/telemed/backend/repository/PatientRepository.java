package com.telemed.backend.repository;

import com.telemed.backend.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository  extends JpaRepository<Patient, Long> {
}
