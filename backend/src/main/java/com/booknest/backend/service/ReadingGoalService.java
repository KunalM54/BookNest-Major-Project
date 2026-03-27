package com.booknest.backend.service;

import com.booknest.backend.model.ReadingGoal;
import com.booknest.backend.model.User;
import com.booknest.backend.repository.BorrowRepository;
import com.booknest.backend.repository.ReadingGoalRepository;
import com.booknest.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ReadingGoalService {
    
    @Autowired
    private ReadingGoalRepository goalRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private BorrowRepository borrowRepository;

    public List<ReadingGoal> getGoalsByStudentId(Long studentId) {
        return goalRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
    }

    public List<ReadingGoal> getActiveGoalsByStudentId(Long studentId) {
        return goalRepository.findActiveGoalsByStudentId(studentId);
    }

    public Map<String, Object> getGoalById(Long goalId, Long studentId) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<ReadingGoal> goal = goalRepository.findByIdAndStudentId(goalId, studentId);
        if (!goal.isPresent()) {
            response.put("success", false);
            response.put("message", "Goal not found");
            return response;
        }
        
        response.put("success", true);
        response.put("data", goal.get());
        return response;
    }

    @Transactional
    public Map<String, Object> createGoal(Long studentId, String goalType, Integer targetBooks, 
            LocalDate startDate, LocalDate endDate) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<User> student = userRepository.findById(studentId);
        if (!student.isPresent()) {
            response.put("success", false);
            response.put("message", "Student not found");
            return response;
        }
        
        if (targetBooks == null || targetBooks < 1) {
            response.put("success", false);
            response.put("message", "Target books must be at least 1");
            return response;
        }
        
        if (endDate.isBefore(startDate)) {
            response.put("success", false);
            response.put("message", "End date must be after start date");
            return response;
        }
        
        ReadingGoal goal = new ReadingGoal();
        goal.setStudent(student.get());
        goal.setGoalType(goalType);
        goal.setTargetBooks(targetBooks);
        goal.setStartDate(startDate);
        goal.setEndDate(endDate);
        goal.setCurrentProgress(0);
        goal.setIsCompleted(false);
        
        ReadingGoal saved = goalRepository.save(goal);
        
        response.put("success", true);
        response.put("message", "Reading goal created successfully");
        response.put("data", saved);
        return response;
    }

    @Transactional
    public Map<String, Object> updateProgress(Long goalId, Long studentId) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<ReadingGoal> goalOpt = goalRepository.findByIdAndStudentId(goalId, studentId);
        if (!goalOpt.isPresent()) {
            response.put("success", false);
            response.put("message", "Goal not found");
            return response;
        }
        
        ReadingGoal goal = goalOpt.get();
        
        long returnedBooks = borrowRepository.findHistoryByStudentId(studentId).stream()
                .filter(b -> b.getReturnDate() != null 
                        && !b.getReturnDate().isBefore(goal.getStartDate())
                        && !b.getReturnDate().isAfter(goal.getEndDate()))
                .count();
        
        goal.setCurrentProgress((int) returnedBooks);
        
        if (returnedBooks >= goal.getTargetBooks()) {
            goal.setIsCompleted(true);
        }
        
        ReadingGoal saved = goalRepository.save(goal);
        
        response.put("success", true);
        response.put("message", "Progress updated");
        response.put("data", saved);
        return response;
    }

    @Transactional
    public Map<String, Object> deleteGoal(Long goalId, Long studentId) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<ReadingGoal> goal = goalRepository.findByIdAndStudentId(goalId, studentId);
        if (!goal.isPresent()) {
            response.put("success", false);
            response.put("message", "Goal not found");
            return response;
        }
        
        goalRepository.deleteById(goalId);
        
        response.put("success", true);
        response.put("message", "Goal deleted");
        return response;
    }
}
