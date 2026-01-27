package com.telemed.backend.model;

import jakarta.persistence.Id;
import lombok.Data;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "health_files")
public class HealthFile {
    @Id
    private String id;

    private String patientEmail; // Link to SQL User
    private String type;         // "PROFILE_PHOTO" or "REPORT"

    // For Reports
    private String reportName;   // User-provided name (e.g. "Blood Test Jan")

    // File Data
    private String fileName;
    private String contentType;  // e.g. "image/png", "application/pdf"
    private byte[] data;         // The actual file binary

    private LocalDateTime uploadDate = LocalDateTime.now();
}