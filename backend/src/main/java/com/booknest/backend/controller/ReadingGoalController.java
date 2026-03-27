package com.booknest.backend.controller;

import com.booknest.backend.model.ReadingGoal;
import com.booknest.backend.service.ReadingGoalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reading-goals")
@CrossOrigin(origins = "*")
public class ReadingGoalController {
    
    @Autowired
    private ReadingGoalService goalService;

    @GetMapping
    public ResponseEntity<List<ReadingGoal>> getGoals(@RequestParam Long studentId) {
        List<ReadingGoal> goals = goalService.getGoalsByStudentId(studentId);
        return ResponseEntity.ok(goals);
    }

    @GetMapping("/active")
    public ResponseEntity<List<ReadingGoal>> getActiveGoals(@RequestParam Long studentId) {
        List<ReadingGoal> goals = goalService.getActiveGoalsByStudentId(studentId);
        return ResponseEntity.ok(goals);
    }

    @GetMapping("/{goalId}")
    public ResponseEntity<Map<String, Object>> getGoalById(
            @PathVariable Long goalId,
            @RequestParam Long studentId) {
        Map<String, Object> result = goalService.getGoalById(goalId, studentId);
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createGoal(
            @RequestParam Long studentId,
            @RequestParam String goalType,
            @RequestParam Integer targetBooks,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Map<String, Object> result = goalService.createGoal(studentId, goalType, targetBooks, startDate, endDate);
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    @PutMapping("/{goalId}/progress")
    public ResponseEntity<Map<String, Object>> updateProgress(
            @PathVariable Long goalId,
            @RequestParam Long studentId) {
        Map<String, Object> result = goalService.updateProgress(goalId, studentId);
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    @DeleteMapping("/{goalId}")
    public ResponseEntity<Map<String, Object>> deleteGoal(
            @PathVariable Long goalId,
            @RequestParam Long studentId) {
        Map<String, Object> result = goalService.deleteGoal(goalId, studentId);
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }
}
