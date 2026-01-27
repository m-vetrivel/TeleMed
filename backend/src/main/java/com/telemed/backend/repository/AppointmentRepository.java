package com.telemed.backend.repository;

import com.telemed.backend.model.Appointment;
import com.telemed.backend.model.Doctor;
import com.telemed.backend.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByDoctorId(Long doctorId);
    List<Appointment> findByPatientId(Long patientId);

    // Custom SQL Query to detect Double Bookings
    @Query("SELECT COUNT(a) > 0 FROM Appointment a " +
            "WHERE a.doctor.id = :doctorId " +
            "AND a.status != 'CANCELLED' " +
            "AND (" +
            "  (a.appointmentTime < :endTime AND a.endTime > :startTime)" +
            ")")
    boolean existsByDoctorAndDateRange(@Param("doctorId") Long doctorId,
                                       @Param("startTime") LocalDateTime startTime,
                                       @Param("endTime") LocalDateTime endTime);

    List<Appointment> findByDoctor(Doctor doctor);

    List<Appointment> findByPatient(Patient patient);
}