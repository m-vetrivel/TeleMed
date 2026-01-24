package com.telemed.backend.repository;

import com.telemed.backend.model.FileDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FileRepository extends MongoRepository<FileDocument, String> {
}