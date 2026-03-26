package com.booknest.backend.service;

import com.booknest.backend.model.Borrow;
import com.booknest.backend.model.Fine;
import com.booknest.backend.model.User;
import com.booknest.backend.repository.BorrowRepository;
import com.booknest.backend.repository.FineRepository;
import com.booknest.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class FineService {

    private static final double FINE_PER_DAY = 30.0;

    @Autowired
    private FineRepository fineRepository;

    @Autowired
    private BorrowRepository borrowRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Fine> getFinesByStudentId(Long studentId) {
        return fineRepository.findByStudentIdAndStatus(studentId, Fine.FineStatus.PENDING);
    }

    public List<Fine> getAllFinesByStudentId(Long studentId) {
        return fineRepository.findByStudentId(studentId);
    }

    public List<Fine> getPendingFinesByStudentId(Long studentId) {
        return fineRepository.findByStudentIdAndStatus(studentId, Fine.FineStatus.PENDING);
    }

    public double getTotalPendingFine(Long studentId) {
        List<Fine> fines = getPendingFinesByStudentId(studentId);
        return fines.stream().mapToDouble(Fine::getFineAmount).sum();
    }

    @Transactional
    public Fine calculateAndCreateFine(Borrow borrow) {
        if (borrow.getReturnDate() != null && borrow.getDueDate() != null) {
            LocalDate returnDate = borrow.getReturnDate();
            LocalDate dueDate = borrow.getDueDate();

            if (returnDate.isAfter(dueDate)) {
                long daysOverdue = ChronoUnit.DAYS.between(dueDate, returnDate);
                
                Optional<Fine> existingFine = fineRepository.findAll().stream()
                    .filter(f -> f.getBorrow().getId().equals(borrow.getId()))
                    .filter(f -> f.getStatus() == Fine.FineStatus.PENDING)
                    .findFirst();

                if (existingFine.isPresent()) {
                    Fine fine = existingFine.get();
                    fine.setDaysOverdue((int) daysOverdue);
                    fine.setFineAmount(daysOverdue * FINE_PER_DAY);
                    return fineRepository.save(fine);
                } else {
                    Fine fine = new Fine(borrow.getStudent(), borrow, (int) daysOverdue, FINE_PER_DAY);
                    return fineRepository.save(fine);
                }
            }
        }
        return null;
    }

    @Transactional
    public Fine payFine(Long fineId, String paymentMethod) {
        Optional<Fine> fineOpt = fineRepository.findById(fineId);
        if (fineOpt.isPresent()) {
            Fine fine = fineOpt.get();
            fine.setStatus(Fine.FineStatus.PAID);
            fine.setPaidAt(java.time.LocalDateTime.now());
            fine.setPaymentMethod(paymentMethod);
            return fineRepository.save(fine);
        }
        return null;
    }

    public double calculateFineForDays(int daysOverdue) {
        return daysOverdue * FINE_PER_DAY;
    }

    public List<Fine> getAllFines() {
        return fineRepository.findAllWithDetails();
    }

    public double getTotalPendingFines() {
        return fineRepository.findAll().stream()
            .filter(f -> f.getStatus() == Fine.FineStatus.PENDING)
            .mapToDouble(Fine::getFineAmount)
            .sum();
    }

    public long getPendingFinesCount() {
        return fineRepository.findAll().stream()
            .filter(f -> f.getStatus() == Fine.FineStatus.PENDING)
            .count();
    }

    public Map<String, Object> calculateFineForBorrow(Borrow borrow) {
        Map<String, Object> result = new HashMap<>();
        
        LocalDate dueDate = borrow.getDueDate();
        LocalDate returnDate = borrow.getReturnDate();
        LocalDate today = LocalDate.now();
        
        long lateDays = 0;
        double fineAmount = 0;
        
        if (dueDate == null) {
            result.put("borrowId", borrow.getId());
            result.put("dueDate", null);
            result.put("returnDate", returnDate);
            result.put("lateDays", 0);
            result.put("fineAmount", 0);
            result.put("status", "NO_DUE_DATE");
            return result;
        }
        
        // Case 1: Returned Late - return_date > due_date
        if (returnDate != null && returnDate.isAfter(dueDate)) {
            lateDays = ChronoUnit.DAYS.between(dueDate, returnDate);
            fineAmount = lateDays * FINE_PER_DAY;
        } 
        // Case 2: Returned On Time - return_date <= due_date
        else if (returnDate != null && !returnDate.isAfter(dueDate)) {
            lateDays = 0;
            fineAmount = 0;
        }
        // Case 3: Not Returned (Overdue) - return_date is NULL and today > due_date
        else if (returnDate == null && today.isAfter(dueDate)) {
            lateDays = ChronoUnit.DAYS.between(dueDate, today);
            fineAmount = lateDays * FINE_PER_DAY;
        }
        // Case 4: Not Due Yet - today <= due_date
        else {
            lateDays = 0;
            fineAmount = 0;
        }
        
        result.put("borrowId", borrow.getId());
        result.put("dueDate", dueDate.toString());
        result.put("returnDate", returnDate != null ? returnDate.toString() : null);
        result.put("lateDays", lateDays);
        result.put("fineAmount", fineAmount);
        result.put("finePerDay", FINE_PER_DAY);
        
        if (returnDate != null && !returnDate.isAfter(dueDate)) {
            result.put("status", "RETURNED_ON_TIME");
        } else if (lateDays > 0 && returnDate != null) {
            result.put("status", "RETURNED_LATE");
        } else if (returnDate == null && lateDays > 0) {
            result.put("status", "OVERDUE");
        } else {
            result.put("status", "ACTIVE");
        }
        
        return result;
    }

    public List<Map<String, Object>> calculateFinesForBorrows(List<Borrow> borrows) {
        return borrows.stream()
            .map(this::calculateFineForBorrow)
            .collect(java.util.stream.Collectors.toList());
    }
}
