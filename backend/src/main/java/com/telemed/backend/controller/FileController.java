//package com.telemed.backend.controller;
//
//import com.telemed.backend.model.FileDocument;
//import com.telemed.backend.repository.FileRepository;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.HttpHeaders;
//import org.springframework.http.MediaType;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//import org.springframework.web.multipart.MultipartFile;
//
//import java.io.IOException;
//
//@RestController
//@RequestMapping("/api/files")
//@CrossOrigin(origins = "http://justa-preoccasioned-sharlene.ngrok-free.dev")
//public class FileController {
//
//    @Autowired
//    private FileRepository fileRepository;
//
//    @PostMapping("/upload")
//    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
//        try {
//            // Save file bytes to MongoDB
//            FileDocument fileDoc = new FileDocument(
//                    file.getOriginalFilename(),
//                    file.getContentType(),
//                    file.getBytes()
//            );
//
//            System.out.println("Saving file to MongoDB: " + file.getOriginalFilename());
//            FileDocument savedFile = fileRepository.save(fileDoc);
//            System.out.println("Saved with ID: " + savedFile.getId());
//
//            // Return the download URL (using the MongoDB ID)
//            return ResponseEntity.ok("/api/files/download/" + savedFile.getId());
//
//        } catch (IOException ex) {
//            return ResponseEntity.status(500).body("Upload failed: " + ex.getMessage());
//        }
//    }
//
//    @GetMapping("/download/{id}")
//    public ResponseEntity<byte[]> downloadFile(@PathVariable String id) {
//        return fileRepository.findById(id)
//                .map(fileDoc -> {
//                    return ResponseEntity.ok()
//                            .contentType(MediaType.parseMediaType(fileDoc.getContentType()))
//                            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileDoc.getName() + "\"")
//                            .body(fileDoc.getData());
//                })
//                .orElse(ResponseEntity.notFound().build());
//    }
//}




package com.telemed.backend.controller;

import com.telemed.backend.model.HealthFile;
import com.telemed.backend.repository.HealthFileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "http://localhost:5173")
public class FileController {

    @Autowired
    private HealthFileRepository fileRepository;

    @Autowired
    private com.telemed.backend.repository.DoctorRepository doctorRepository; // Add this

    // 1. Upload Profile Photo
    @PostMapping("/photo")
    public ResponseEntity<?> uploadPhoto(@RequestParam("file") MultipartFile file) throws IOException {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        // Save new photo
        HealthFile photo = new HealthFile();
        photo.setPatientEmail(email);
        photo.setType("PROFILE_PHOTO");
        photo.setFileName(file.getOriginalFilename());
        photo.setContentType(file.getContentType());
        photo.setData(file.getBytes());

        fileRepository.save(photo);
        return ResponseEntity.ok("Photo Updated");
    }

    // 2. Get My Profile Photo (View)
    @GetMapping("/photo")
    public ResponseEntity<byte[]> getMyPhoto() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        // Get latest photo
        return fileRepository.findFirstByPatientEmailAndTypeOrderByUploadDateDesc(email, "PROFILE_PHOTO")
                .map(file -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(file.getContentType()))
                        .body(file.getData()))
                .orElse(ResponseEntity.notFound().build());
    }


// 3. Upload Health Report (Updated for Chat)
    @PostMapping("/report")
    public ResponseEntity<?> uploadReport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("reportName") String reportName
    ) throws IOException {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        HealthFile report = new HealthFile();
        report.setPatientEmail(email);
        report.setType("REPORT");
        report.setReportName(reportName);
        report.setFileName(file.getOriginalFilename());
        report.setContentType(file.getContentType());
        report.setData(file.getBytes());

        HealthFile savedFile = fileRepository.save(report);

        // return the WHOLE object (or at least ID) so Frontend can use it
        return ResponseEntity.ok(savedFile);
    }

    // 4. Get List of My Reports (JSON Metadata only)
    @GetMapping("/reports")
    public List<HealthFile> getMyReports() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<HealthFile> files = fileRepository.findByPatientEmailAndType(email, "REPORT");
        // Clear binary data to make response light
        files.forEach(f -> f.setData(null));
        return files;
    }

    // 5. View/Download specific Report
    @GetMapping("/{id}")
    public ResponseEntity<byte[]> getFile(@PathVariable String id) {
        HealthFile file = fileRepository.findById(id).orElseThrow(() -> new RuntimeException("File not found"));

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFileName() + "\"")
                .body(file.getData());
    }



    // ... existing imports

    // 6. Upload Doctor Certificate
    @PostMapping("/certificate")
    public ResponseEntity<?> uploadCertificate(@RequestParam("file") MultipartFile file) throws IOException {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        // Save as CERTIFICATE type
        HealthFile cert = new HealthFile();
        cert.setPatientEmail(email); // Using email as the key
        cert.setType("CERTIFICATE");
        cert.setFileName(file.getOriginalFilename());
        cert.setContentType(file.getContentType());
        cert.setData(file.getBytes());

        fileRepository.save(cert);
        return ResponseEntity.ok("Certificate Uploaded");
    }

    // 7. Get Certificate (View/Download)
    @GetMapping("/certificate")
    public ResponseEntity<byte[]> getCertificate() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        return fileRepository.findFirstByPatientEmailAndTypeOrderByUploadDateDesc(email, "CERTIFICATE")
                .map(file -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(file.getContentType()))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
                        .body(file.getData()))
                .orElse(ResponseEntity.notFound().build());
    }



    // ... existing endpoints ...

    // 8. Public Endpoint: Get ALL Doctor Certificates (Metadata Only)
    @GetMapping("/doctor/{doctorId}/certificates")
    public ResponseEntity<List<HealthFile>> getDoctorCertificates(@PathVariable Long doctorId) {
        // 1. Find Doctor
        var doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        String doctorEmail = doctor.getUser().getEmail();

        // 2. Find all certificates
        List<HealthFile> files = fileRepository.findByPatientEmailAndType(doctorEmail, "CERTIFICATE");

        // 3. IMPORTANT: Clear binary data so the JSON response is small/fast
        // The actual file content will be downloaded via the /api/files/{id} endpoint
        files.forEach(f -> f.setData(null));

        return ResponseEntity.ok(files);
    }
    // 9. Get All My Uploaded Files (Certificates, Reports, etc.)
    @GetMapping("/me/all")
    public List<HealthFile> getMyFiles() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        // You might need to add this method to your Repository: findByPatientEmail(email)
        // For now, let's fetch specific types we know about
        List<HealthFile> files = fileRepository.findByPatientEmailAndType(email, "CERTIFICATE");
        // Add others if needed: files.addAll(fileRepository.findByPatientEmailAndType(email, "REPORT"));

        files.forEach(f -> f.setData(null)); // Clear binary data for speed
        return files;
    }

    // 10. Delete a File
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable String id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        HealthFile file = fileRepository.findById(id).orElseThrow(() -> new RuntimeException("File not found"));

        // Security: Ensure it belongs to the user
        if (!file.getPatientEmail().equals(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You do not own this file");
        }

        fileRepository.delete(file);
        return ResponseEntity.ok("File deleted successfully");
    }
}