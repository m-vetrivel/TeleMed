package com.telemed.backend.controller;

import com.telemed.backend.model.FileDocument;
import com.telemed.backend.repository.FileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "http://justa-preoccasioned-sharlene.ngrok-free.dev")
public class FileController {

    @Autowired
    private FileRepository fileRepository;

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            // Save file bytes to MongoDB
            FileDocument fileDoc = new FileDocument(
                    file.getOriginalFilename(),
                    file.getContentType(),
                    file.getBytes()
            );

            System.out.println("Saving file to MongoDB: " + file.getOriginalFilename());
            FileDocument savedFile = fileRepository.save(fileDoc);
            System.out.println("Saved with ID: " + savedFile.getId());

            // Return the download URL (using the MongoDB ID)
            return ResponseEntity.ok("/api/files/download/" + savedFile.getId());

        } catch (IOException ex) {
            return ResponseEntity.status(500).body("Upload failed: " + ex.getMessage());
        }
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable String id) {
        return fileRepository.findById(id)
                .map(fileDoc -> {
                    return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType(fileDoc.getContentType()))
                            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileDoc.getName() + "\"")
                            .body(fileDoc.getData());
                })
                .orElse(ResponseEntity.notFound().build());
    }
}