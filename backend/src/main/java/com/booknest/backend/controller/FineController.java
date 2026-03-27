package com.booknest.backend.controller;

import com.booknest.backend.dto.FineDTO;
import com.booknest.backend.model.Borrow;
import com.booknest.backend.repository.BorrowRepository;
import com.booknest.backend.service.FineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/fines")
@CrossOrigin(origins = "*")
public class FineController {

    private final FineService fineService;
    private final BorrowRepository borrowRepository;

    public FineController(FineService fineService, BorrowRepository borrowRepository) {
        this.fineService = fineService;
        this.borrowRepository = borrowRepository;
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<Map<String, Object>> getFinesByStudent(@PathVariable Long studentId) {
        List<FineDTO> fines = fineService.getFinesForStudent(studentId);
        double totalPending = fineService.getTotalPendingForStudent(studentId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", fines);
        response.put("totalPending", totalPending);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/student/{studentId}/all")
    public ResponseEntity<Map<String, Object>> getAllFinesByStudent(@PathVariable Long studentId) {
        return getFinesByStudent(studentId);
    }

    @PostMapping("/pay/{fineId}")
    public ResponseEntity<Map<String, Object>> payFine(
            @PathVariable Long fineId,
            @RequestBody Map<String, Object> paymentRequest) {

        Long paymentId = null;
        try {
            if (paymentRequest.containsKey("paymentId") && paymentRequest.get("paymentId") != null) {
                paymentId = Long.valueOf(paymentRequest.get("paymentId").toString());
            }
        } catch (Exception ignored) {
        }

        try {
            FineDTO paidFine = fineService.payFine(fineId, paymentId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Fine paid successfully");
            response.put("data", paidFine);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/calculate")
    public ResponseEntity<Map<String, Object>> calculateFine(@RequestParam int daysOverdue) {
        double fineAmount = fineService.calculateFineForDays(daysOverdue);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("daysOverdue", daysOverdue);
        response.put("finePerDay", fineService.getFinePerDay());
        response.put("totalFine", fineAmount);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/borrow/{borrowId}")
    public ResponseEntity<Map<String, Object>> calculateFineForBorrow(@PathVariable Long borrowId) {
        Optional<Borrow> borrowOpt = borrowRepository.findById(borrowId);

        if (borrowOpt.isEmpty()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Borrow not found");
            return ResponseEntity.ok(response);
        }

        Borrow borrow = borrowOpt.get();
        int lateDays = 0;
        if (borrow.getDueDate() != null) {
            java.time.LocalDate refDate = borrow.getReturnDate() != null ? borrow.getReturnDate() : java.time.LocalDate.now();
            if (refDate.isAfter(borrow.getDueDate())) {
                lateDays = (int) java.time.temporal.ChronoUnit.DAYS.between(borrow.getDueDate(), refDate);
            }
        }
        double fineAmount = fineService.calculateFineForDays(lateDays);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("borrowId", borrowId);
        response.put("dueDate", borrow.getDueDate());
        response.put("returnDate", borrow.getReturnDate());
        response.put("lateDays", lateDays);
        response.put("fineAmount", fineAmount);
        response.put("finePerDay", fineService.getFinePerDay());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{fineId}")
    public ResponseEntity<Map<String, Object>> getFineById(@PathVariable Long fineId) {
        Optional<FineDTO> fineOpt = fineService.getFineById(fineId);

        Map<String, Object> response = new HashMap<>();
        if (fineOpt.isPresent()) {
            response.put("success", true);
            response.put("data", fineOpt.get());
        } else {
            response.put("success", false);
            response.put("message", "Fine not found");
        }

        return ResponseEntity.ok(response);
    }
}
