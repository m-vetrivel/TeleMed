package com.telemed.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AppointmentRequest {
    private Long doctorId;
    // Format: "2026-02-20T10:00:00"
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}