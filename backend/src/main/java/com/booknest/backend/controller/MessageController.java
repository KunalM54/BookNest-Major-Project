package com.booknest.backend.controller;

import com.booknest.backend.model.Message;
import com.booknest.backend.model.User;
import com.booknest.backend.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class MessageController {
    
    @Autowired
    private MessageService messageService;

    @GetMapping("/conversation")
    public ResponseEntity<List<Message>> getConversation(
            @RequestParam Long userId1,
            @RequestParam Long userId2) {
        List<Message> messages = messageService.getConversation(userId1, userId2);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/partners")
    public ResponseEntity<List<User>> getConversationPartners(@RequestParam Long userId) {
        List<User> partners = messageService.getConversationPartners(userId);
        return ResponseEntity.ok(partners);
    }

    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @RequestParam Long senderId,
            @RequestParam Long receiverId,
            @RequestParam String content) {
        Map<String, Object> result = messageService.sendMessage(senderId, receiverId, content);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{messageId}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Long messageId) {
        messageService.markAsRead(messageId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markConversationAsRead(
            @RequestParam Long userId,
            @RequestParam Long otherUserId) {
        messageService.markConversationAsRead(userId, otherUserId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/unread")
    public ResponseEntity<Map<String, Object>> getUnreadCount(@RequestParam Long userId) {
        Long count = messageService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("count", count));
    }
}