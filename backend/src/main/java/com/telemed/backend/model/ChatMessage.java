package com.telemed.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String senderEmail;
    private String recipientEmail;
    private String content;
    private LocalDateTime timestamp;


    // --- ADD THESE 3 NEW FIELDS ---
    private String fileUrl;
    private String fileName;
    private String type; // 'TEXT' or 'FILE'

    // --- ADD GETTERS AND SETTERS ---
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}