package com.telemed.backend.controller;

import com.telemed.backend.model.ChatMessage;
import com.telemed.backend.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;

    // 1. WebSocket Endpoint: User sends message here
    // Frontend sends to: /app/chat
    @MessageMapping("/chat")
    public void processMessage(@Payload ChatMessage chatMessage) {
        chatMessage.setTimestamp(LocalDateTime.now());
        ChatMessage saved = chatMessageRepository.save(chatMessage);

        // 1. Send to Recipient (The other person)
        messagingTemplate.convertAndSendToUser(
                chatMessage.getRecipientEmail(),
                "/queue/messages",
                saved
        );

        // 2. Send to Sender (Me) - So I know it was saved
        messagingTemplate.convertAndSendToUser(
                chatMessage.getSenderEmail(),
                "/queue/messages",
                saved
        );
    }

    // 2. HTTP Endpoint: Load History (REST API)
    @GetMapping("/api/messages/{user1}/{user2}")
    public ResponseEntity<List<ChatMessage>> getChatHistory(
            @PathVariable String user1,
            @PathVariable String user2) {

        return ResponseEntity.ok(chatMessageRepository
                .findBySenderEmailAndRecipientEmailOrSenderEmailAndRecipientEmailOrderByTimestampAsc(
                        user1, user2, user2, user1
                ));
    }


    @MessageMapping("/video")
    public void processVideoSignal(@Payload Map<String, Object> signalData) {
        String recipientEmail = (String) signalData.get("recipientEmail");

        // Forward directly to the user (Don't save to DB)
        messagingTemplate.convertAndSendToUser(
                recipientEmail,
                "/queue/video",
                signalData
        );
    }
}