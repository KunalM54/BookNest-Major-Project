package com.booknest.backend.controller;

import com.booknest.backend.dto.FineDTO;
import com.booknest.backend.service.FineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/fines")
@CrossOrigin(origins = "*")
public class AdminFineController {

    private final FineService fineService;

    public AdminFineController(FineService fineService) {
        this.fineService = fineService;
    }

    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllFines() {
        fineService.recalculateAllFines();
        List<FineDTO> fines = fineService.getAllFines();

        double totalPending = fines.stream()
                .filter(FineDTO::isUnpaid)
                .mapToDouble(FineDTO::getFineAmount)
                .sum();

        double totalPaid = fines.stream()
                .filter(FineDTO::isPaid)
                .mapToDouble(FineDTO::getFineAmount)
                .sum();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", fines);
        response.put("totalPending", totalPending);
        response.put("totalPaid", totalPaid);
        response.put("pendingCount", fines.stream().filter(FineDTO::isUnpaid).count());
        response.put("paidCount", fines.stream().filter(FineDTO::isPaid).count());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshFines() {
        fineService.recalculateAllFines();
        List<FineDTO> fines = fineService.getAllFines();

        double totalPending = fines.stream()
                .filter(FineDTO::isUnpaid)
                .mapToDouble(FineDTO::getFineAmount)
                .sum();

        double totalPaid = fines.stream()
                .filter(FineDTO::isPaid)
                .mapToDouble(FineDTO::getFineAmount)
                .sum();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Fines refreshed successfully");
        response.put("data", fines);
        response.put("totalPending", totalPending);
        response.put("totalPaid", totalPaid);
        response.put("pendingCount", fines.stream().filter(FineDTO::isUnpaid).count());
        response.put("paidCount", fines.stream().filter(FineDTO::isPaid).count());

        return ResponseEntity.ok(response);
    }
}
