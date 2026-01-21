package com.telemed.backend.controller;

import com.telemed.backend.dto.AppointmentRequest;
import com.telemed.backend.model.Appointment;
import com.telemed.backend.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping("/book")
    public ResponseEntity<Appointment> bookAppointment(@RequestBody AppointmentRequest request) {
        return ResponseEntity.ok(appointmentService.bookAppointment(request));
    }

    @GetMapping
    public ResponseEntity<List<Appointment>> getMyAppointments() {
        return ResponseEntity.ok(appointmentService.getMyAppointments());
    }
}