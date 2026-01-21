package com.telemed.backend.repository;

import com.telemed.backend.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    // Find the Doctor profile linked to a specific User Login
    Optional<Doctor> findByUserId(Long userId);
}