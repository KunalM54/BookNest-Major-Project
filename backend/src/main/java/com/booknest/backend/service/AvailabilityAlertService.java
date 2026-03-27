package com.booknest.backend.service;

import com.booknest.backend.model.AvailabilityAlert;
import com.booknest.backend.model.Book;
import com.booknest.backend.model.User;
import com.booknest.backend.repository.AvailabilityAlertRepository;
import com.booknest.backend.repository.BookRepository;
import com.booknest.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AvailabilityAlertService {
    
    @Autowired
    private AvailabilityAlertRepository alertRepository;
    
    @Autowired
    private BookRepository bookRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;

    public List<AvailabilityAlert> getAlertsByStudentId(Long studentId) {
        return alertRepository.findByStudentIdAndIsActiveTrue(studentId);
    }

    public Map<String, Object> createAlert(Long studentId, Long bookId) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<User> student = userRepository.findById(studentId);
        if (!student.isPresent()) {
            response.put("success", false);
            response.put("message", "Student not found");
            return response;
        }
        
        Optional<Book> book = bookRepository.findById(bookId);
        if (!book.isPresent()) {
            response.put("success", false);
            response.put("message", "Book not found");
            return response;
        }
        
        if (book.get().getAvailableCopies() > 0) {
            response.put("success", false);
            response.put("message", "Book is already available. No need for alert.");
            return response;
        }
        
        if (alertRepository.existsByStudentIdAndBookIdAndIsActiveTrue(studentId, bookId)) {
            response.put("success", false);
            response.put("message", "Alert already exists for this book");
            return response;
        }
        
        AvailabilityAlert alert = new AvailabilityAlert();
        alert.setStudent(student.get());
        alert.setBook(book.get());
        alert.setIsActive(true);
        
        AvailabilityAlert saved = alertRepository.save(alert);
        
        response.put("success", true);
        response.put("message", "Alert created. We'll notify you when the book is available.");
        response.put("data", saved);
        return response;
    }

    @Transactional
    public Map<String, Object> removeAlert(Long alertId, Long studentId) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<AvailabilityAlert> alert = alertRepository.findById(alertId);
        if (!alert.isPresent()) {
            response.put("success", false);
            response.put("message", "Alert not found");
            return response;
        }
        
        if (!alert.get().getStudent().getId().equals(studentId)) {
            response.put("success", false);
            response.put("message", "Unauthorized");
            return response;
        }
        
        alertRepository.deleteById(alertId);
        
        response.put("success", true);
        response.put("message", "Alert removed");
        return response;
    }

    @Transactional
    public void notifyStudentsWhenAvailable(Long bookId) {
        List<AvailabilityAlert> alerts = alertRepository.findActiveAlertsByBookId(bookId);
        
        if (alerts.isEmpty()) return;
        
        Book book = bookRepository.findById(bookId).orElse(null);
        if (book == null || book.getAvailableCopies() <= 0) return;
        
        for (AvailabilityAlert alert : alerts) {
            try {
                emailService.sendAvailabilityAlertEmail(alert.getStudent(), book);
                
                alert.setIsActive(false);
                alert.setNotifiedAt(LocalDateTime.now());
                alertRepository.save(alert);
            } catch (Exception e) {
                // Log error but continue with other alerts
            }
        }
    }
}
