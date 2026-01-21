package com.telemed.backend.repository;

import com.telemed.backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    // Find chat history between two people
    // Logic: (Sender=Me AND Recipient=You) OR (Sender=You AND Recipient=Me)
    List<ChatMessage> findBySenderEmailAndRecipientEmailOrSenderEmailAndRecipientEmailOrderByTimestampAsc(
            String sender1, String recipient1, String sender2, String recipient2
    );
}