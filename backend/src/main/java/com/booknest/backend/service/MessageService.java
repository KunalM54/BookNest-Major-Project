package com.booknest.backend.service;

import com.booknest.backend.model.Message;
import com.booknest.backend.model.User;
import com.booknest.backend.repository.MessageRepository;
import com.booknest.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class MessageService {
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UserRepository userRepository;

    public List<Message> getConversation(Long userId1, Long userId2) {
        return messageRepository.findConversation(userId1, userId2);
    }

    public List<User> getConversationPartners(Long userId) {
        List<Object> partners = messageRepository.findPartners(userId);
        List<User> users = new ArrayList<>();
        for (Object obj : partners) {
            if (obj instanceof User) {
                users.add((User) obj);
            }
        }
        return users;
    }

    public Long getUnreadCount(Long userId) {
        return messageRepository.countUnread(userId);
    }

    public Map<String, Object> sendMessage(Long senderId, Long receiverId, String content) {
        Map<String, Object> result = new HashMap<>();
        
        if (content == null || content.trim().isEmpty()) {
            result.put("success", false);
            result.put("message", "Message cannot be empty");
            return result;
        }
        
        Optional<User> sender = userRepository.findById(senderId);
        Optional<User> receiver = userRepository.findById(receiverId);
        
        if (!sender.isPresent() || !receiver.isPresent()) {
            result.put("success", false);
            result.put("message", "User not found");
            return result;
        }
        
        Message msg = new Message();
        msg.setSender(sender.get());
        msg.setReceiver(receiver.get());
        msg.setContent(content.trim());
        msg.setIsRead(false);
        
        Message saved = messageRepository.save(msg);
        
        result.put("success", true);
        result.put("message", "Message sent");
        result.put("data", saved);
        return result;
    }

    public void markAsRead(Long messageId) {
        messageRepository.findById(messageId).ifPresent(msg -> {
            msg.setIsRead(true);
            messageRepository.save(msg);
        });
    }

    public void markConversationAsRead(Long userId, Long otherUserId) {
        List<Message> messages = messageRepository.findConversation(userId, otherUserId);
        for (Message msg : messages) {
            if (msg.getReceiver().getId().equals(userId) && !msg.getIsRead()) {
                msg.setIsRead(true);
                messageRepository.save(msg);
            }
        }
    }
}