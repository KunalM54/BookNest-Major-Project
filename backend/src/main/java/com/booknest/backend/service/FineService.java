package com.booknest.backend.service;

import com.booknest.backend.model.Borrow;
import com.booknest.backend.model.Fine;
import com.booknest.backend.repository.BorrowRepository;
import com.booknest.backend.repository.FineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class FineService {

    @Value("${booknest.fine.perDay:30}")
    private double finePerDay;

    @Autowired
    private FineRepository fineRepository;

    @Autowired
    private BorrowRepository borrowRepository;

    public double getFinePerDay() {
        return finePerDay;
    }

    private long computeLateDays(LocalDate dueDate, LocalDate returnDate, LocalDate today) {
        if (dueDate == null) {
            return 0;
        }

        // Case 1 & 2: Returned
        if (returnDate != null) {
            if (returnDate.isAfter(dueDate)) {
                return ChronoUnit.DAYS.between(dueDate, returnDate);
            }
            return 0;
        }

        // Case 3 & 4: Not returned
        if (today != null && today.isAfter(dueDate)) {
            return ChronoUnit.DAYS.between(dueDate, today);
        }

        return 0;
    }

    private double computeFineAmount(long lateDays) {
        if (lateDays <= 0) {
            return 0.0;
        }
        return lateDays * finePerDay;
    }

    private double safeDouble(Double value) {
        return value == null ? 0.0 : value;
    }

    @Transactional
    public Fine recalculateAndPersistFineForBorrow(Borrow borrow) {
        if (borrow == null) {
            return null;
        }

        LocalDate dueDate = borrow.getDueDate();
        LocalDate returnDate = borrow.getReturnDate();
        LocalDate today = LocalDate.now();

        long lateDays = computeLateDays(dueDate, returnDate, today);
        double totalFine = computeFineAmount(lateDays);

        if (totalFine <= 0.0) {
            return null;
        }

        Optional<Fine> existingOpt = fineRepository.findByBorrowId(borrow.getId());
        Fine fine = existingOpt.orElseGet(() -> new Fine(borrow.getStudent(), borrow, (int) lateDays, finePerDay));

        fine.setStudent(borrow.getStudent());
        fine.setBorrow(borrow);
        fine.setDaysOverdue((int) lateDays);
        fine.setFinePerDay(finePerDay);
        fine.setFineAmount(totalFine);

        double paidAmount = safeDouble(fine.getPaidAmount());
        fine.setPaidAmount(paidAmount);

        double outstanding = Math.max(0.0, totalFine - paidAmount);
        fine.setStatus(outstanding <= 0.0 ? Fine.FineStatus.PAID : Fine.FineStatus.PENDING);

        return fineRepository.save(fine);
    }

    @Transactional
    public List<Fine> recalculateFinesForStudent(Long studentId) {
        List<Borrow> borrows = borrowRepository.findByStudentIdOrderByRequestDateDesc(studentId);
        for (Borrow borrow : borrows) {
            recalculateAndPersistFineForBorrow(borrow);
        }
        return fineRepository.findByStudentIdWithDetails(studentId);
    }

    @Transactional
    public void recalculateAllPotentialFines() {
        List<Borrow> borrows = borrowRepository.findBorrowsWithPotentialFines();
        for (Borrow borrow : borrows) {
            recalculateAndPersistFineForBorrow(borrow);
        }
    }

    @Transactional
    public Fine payFine(Long fineId, String paymentMethod) {
        return payFine(fineId, paymentMethod, null);
    }

    @Transactional
    public Fine payFine(Long fineId, String paymentMethod, Double requestedAmount) {
        Optional<Fine> fineOpt = fineRepository.findById(fineId);
        if (fineOpt.isEmpty()) {
            return null;
        }

        Fine fine = fineOpt.get();

        // Ensure we pay against the latest dynamic fine value.
        Fine refreshed = recalculateAndPersistFineForBorrow(fine.getBorrow());
        if (refreshed == null) {
            return fine;
        }

        double totalFine = safeDouble(refreshed.getFineAmount());
        double alreadyPaid = safeDouble(refreshed.getPaidAmount());
        double outstanding = Math.max(0.0, totalFine - alreadyPaid);

        if (outstanding <= 0.0) {
            refreshed.setStatus(Fine.FineStatus.PAID);
            return fineRepository.save(refreshed);
        }

        double amountToPay;
        if (requestedAmount == null || requestedAmount <= 0.0) {
            amountToPay = outstanding;
        } else {
            amountToPay = Math.min(requestedAmount, outstanding);
        }

        refreshed.setPaidAmount(alreadyPaid + amountToPay);
        refreshed.setPaymentMethod(paymentMethod);
        refreshed.setPaidAt(LocalDateTime.now());

        double newOutstanding = Math.max(0.0, totalFine - safeDouble(refreshed.getPaidAmount()));
        refreshed.setStatus(newOutstanding <= 0.0 ? Fine.FineStatus.PAID : Fine.FineStatus.PENDING);

        return fineRepository.save(refreshed);
    }

    public double calculateFineForDays(int daysOverdue) {
        return daysOverdue * finePerDay;
    }

    public Map<String, Object> calculateFineForBorrow(Borrow borrow) {
        Map<String, Object> result = new HashMap<>();

        LocalDate dueDate = borrow.getDueDate();
        LocalDate returnDate = borrow.getReturnDate();
        LocalDate today = LocalDate.now();

        long lateDays = computeLateDays(dueDate, returnDate, today);
        double fineAmount = computeFineAmount(lateDays);

        result.put("borrowId", borrow.getId());
        result.put("dueDate", dueDate != null ? dueDate.toString() : null);
        result.put("returnDate", returnDate != null ? returnDate.toString() : null);
        result.put("lateDays", lateDays);
        result.put("fineAmount", fineAmount);
        result.put("finePerDay", finePerDay);

        if (dueDate == null) {
            result.put("status", "NO_DUE_DATE");
        } else if (returnDate != null && lateDays == 0) {
            result.put("status", "RETURNED_ON_TIME");
        } else if (returnDate != null && lateDays > 0) {
            result.put("status", "RETURNED_LATE");
        } else if (returnDate == null && lateDays > 0) {
            result.put("status", "OVERDUE");
        } else {
            result.put("status", "ACTIVE");
        }

        return result;
    }

    public List<Map<String, Object>> calculateFinesForBorrows(List<Borrow> borrows) {
        List<Map<String, Object>> results = new ArrayList<>();
        for (Borrow borrow : borrows) {
            results.add(calculateFineForBorrow(borrow));
        }
        return results;
    }

    @Transactional
    public List<Fine> getAllFinesWithDetails() {
        recalculateAllPotentialFines();
        return fineRepository.findAllWithDetails();
    }

    @Transactional
    public double getTotalPendingFine(Long studentId) {
        List<Fine> fines = recalculateFinesForStudent(studentId);
        return fines.stream()
                .filter(f -> f.getStatus() == Fine.FineStatus.PENDING)
                .mapToDouble(f -> Math.max(0.0, safeDouble(f.getFineAmount()) - safeDouble(f.getPaidAmount())))
                .sum();
    }

    @Transactional
    public double getTotalPendingFines() {
        recalculateAllPotentialFines();
        return fineRepository.findAll().stream()
                .filter(f -> f.getStatus() == Fine.FineStatus.PENDING)
                .mapToDouble(f -> Math.max(0.0, safeDouble(f.getFineAmount()) - safeDouble(f.getPaidAmount())))
                .sum();
    }

    @Transactional
    public long getPendingFinesCount() {
        recalculateAllPotentialFines();
        return fineRepository.findAll().stream()
                .filter(f -> f.getStatus() == Fine.FineStatus.PENDING)
                .count();
    }
}
