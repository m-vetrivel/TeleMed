package com.telemed.backend.repository;

import com.telemed.backend.model.HealthFile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface HealthFileRepository extends MongoRepository<HealthFile, String> {
    List<HealthFile> findByPatientEmailAndType(String email, String type);
    Optional<HealthFile> findFirstByPatientEmailAndTypeOrderByUploadDateDesc(String email, String type);
}