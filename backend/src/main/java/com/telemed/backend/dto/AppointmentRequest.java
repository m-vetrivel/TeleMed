package com.telemed.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AppointmentRequest {
    private Long doctorId;
    private LocalDateTime appointmentTime;
    private LocalDateTime endTime;

}