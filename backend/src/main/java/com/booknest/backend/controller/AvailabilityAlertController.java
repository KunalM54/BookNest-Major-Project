package com.booknest.backend.controller;

import com.booknest.backend.model.AvailabilityAlert;
import com.booknest.backend.service.AvailabilityAlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
public class AvailabilityAlertController {
    
    @Autowired
    private AvailabilityAlertService alertService;

    @GetMapping
    public ResponseEntity<List<AvailabilityAlert>> getAlerts(@RequestParam Long studentId) {
        List<AvailabilityAlert> alerts = alertService.getAlertsByStudentId(studentId);
        return ResponseEntity.ok(alerts);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createAlert(
            @RequestParam Long studentId,
            @RequestParam Long bookId) {
        Map<String, Object> result = alertService.createAlert(studentId, bookId);
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    @DeleteMapping("/{alertId}")
    public ResponseEntity<Map<String, Object>> removeAlert(
            @PathVariable Long alertId,
            @RequestParam Long studentId) {
        Map<String, Object> result = alertService.removeAlert(alertId, studentId);
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }
}
