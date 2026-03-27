package com.booknest.backend.service;

import com.booknest.backend.dto.FineDTO;
import com.booknest.backend.model.Borrow;
import com.booknest.backend.model.Fine;
import com.booknest.backend.repository.BorrowRepository;
import com.booknest.backend.repository.FineRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FineService {

    @Value("${booknest.fine.perDay:30}")
    private double finePerDay;

    private final FineRepository fineRepository;
    private final BorrowRepository borrowRepository;

    public FineService(FineRepository fineRepository, BorrowRepository borrowRepository) {
        this.fineRepository = fineRepository;
        this.borrowRepository = borrowRepository;
    }

    public double getFinePerDay() {
        return finePerDay;
    }

    private int calculateLateDays(LocalDate dueDate, LocalDate returnDate) {
        if (dueDate == null) {
            return 0;
        }
        LocalDate referenceDate = returnDate != null ? returnDate : LocalDate.now();
        if (referenceDate.isAfter(dueDate)) {
            return (int) ChronoUnit.DAYS.between(dueDate, referenceDate);
        }
        return 0;
    }

    private FineDTO toDTO(Fine fine) {
        FineDTO dto = new FineDTO();
        dto.setId(fine.getId());
        dto.setDueDate(fine.getDueDate());
        dto.setReturnDate(fine.getReturnDate());

        int calculatedLateDays = calculateLateDays(fine.getDueDate(), fine.getReturnDate());
        dto.setLateDays(calculatedLateDays);

        dto.setFinePerDay(fine.getFinePerDay() != null ? fine.getFinePerDay() : 0);

        double calculatedAmount = calculatedLateDays * finePerDay;
        double totalFine = calculatedAmount > 0 ? calculatedAmount
                : (fine.getFineAmount() != null ? fine.getFineAmount() : 0);
        dto.setFineAmount(totalFine);

        dto.setFineStatus(fine.getFineStatus() != null ? fine.getFineStatus().name() : "UNPAID");
        dto.setPaymentId(fine.getPaymentId());
        dto.setCreatedAt(fine.getCreatedAt());
        dto.setBorrowId(fine.getBorrow() != null ? fine.getBorrow().getId() : null);

        if (fine.getFineStatus() == Fine.FineStatus.PAID) {
            dto.setPaidAmount(totalFine);
        } else {
            dto.setPaidAmount(0.0);
        }

        if (fine.getStudent() != null) {
            dto.setStudentName(fine.getStudent().getFullName());
            dto.setStudentId(fine.getStudent().getStudentId());
        }

        if (fine.getBorrow() != null) {
            if (fine.getBorrow().getBook() != null) {
                dto.setBookTitle(fine.getBorrow().getBook().getTitle());
                dto.setBookAuthor(fine.getBorrow().getBook().getAuthor());
            }
        }

        return dto;
    }

    @Transactional
    public FineDTO recalculateAndCreateFine(Borrow borrow) {
        if (borrow == null || borrow.getDueDate() == null) {
            return null;
        }

        int lateDays = calculateLateDays(borrow.getDueDate(), borrow.getReturnDate());
        if (lateDays <= 0) {
            return null;
        }

        double fineAmount = lateDays * finePerDay;

        Optional<Fine> existingOpt = fineRepository.findByBorrowId(borrow.getId());
        Fine fine = existingOpt.orElseGet(() -> {
            Fine f = new Fine();
            f.setBorrow(borrow);
            f.setStudent(borrow.getStudent());
            return f;
        });

        fine.setDueDate(borrow.getDueDate());
        fine.setReturnDate(borrow.getReturnDate());
        fine.setLateDays(lateDays);
        fine.setFinePerDay(finePerDay);
        fine.setFineAmount(fineAmount);

        if (fine.getFineStatus() == null) {
            fine.setFineStatus(Fine.FineStatus.UNPAID);
        }

        fine = fineRepository.save(fine);
        return toDTO(fine);
    }

    @Transactional(readOnly = true)
    public List<FineDTO> getFinesForStudent(Long studentId) {
        return fineRepository.findByStudentIdWithDetails(studentId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FineDTO> getAllFines() {
        return fineRepository.findAllWithDetails()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public double getTotalPendingForStudent(Long studentId) {
        return fineRepository.findByStudentIdAndFineStatus(studentId, Fine.FineStatus.UNPAID)
                .stream()
                .mapToDouble(f -> f.getFineAmount() != null ? f.getFineAmount() : 0)
                .sum();
    }

    @Transactional
    public FineDTO payFine(Long fineId, Long paymentId) {
        Fine fine = fineRepository.findById(fineId)
                .orElseThrow(() -> new RuntimeException("Fine not found"));

        if (fine.getFineStatus() == Fine.FineStatus.PAID) {
            throw new RuntimeException("Fine already paid");
        }

        fine.setFineStatus(Fine.FineStatus.PAID);
        fine.setPaymentId(paymentId);
        fine = fineRepository.save(fine);

        return toDTO(fine);
    }

    @Transactional
    public List<FineDTO> recalculateAllFinesAndGetAll() {
        recalculateAllFines();
        return getAllFines();
    }

    @Transactional
    public void recalculateAllFines() {
        List<Borrow> overdueBorrows = borrowRepository.findBorrowsWithPotentialFines();
        for (Borrow borrow : overdueBorrows) {
            try {
                recalculateAndPersistFineForBorrow(borrow);
            } catch (Exception e) {
                System.err.println("Error recalculating fine for borrow " + borrow.getId() + ": " + e.getMessage());
            }
        }

        List<Fine> allExistingFines = fineRepository.findAll();
        for (Fine fine : allExistingFines) {
            try {
                if (fine.getFineStatus() == Fine.FineStatus.PAID) {
                    continue;
                }

                int calculatedLateDays = calculateLateDays(fine.getDueDate(), fine.getReturnDate());
                if (calculatedLateDays <= 0) {
                    continue;
                }

                double calculatedAmount = calculatedLateDays * finePerDay;
                fine.setLateDays(calculatedLateDays);
                fine.setFineAmount(calculatedAmount);
                fineRepository.save(fine);
            } catch (Exception e) {
                System.err.println("Error recalculating existing fine " + fine.getId() + ": " + e.getMessage());
            }
        }
    }

    public double calculateFineForDays(int daysOverdue) {
        return daysOverdue * finePerDay;
    }

    @Transactional(readOnly = true)
    public Optional<FineDTO> getFineById(Long fineId) {
        return fineRepository.findById(fineId).map(this::toDTO);
    }

    @Transactional
    public Fine recalculateAndPersistFineForBorrow(Borrow borrow) {
        if (borrow == null || borrow.getDueDate() == null) {
            return null;
        }

        int lateDays = calculateLateDays(borrow.getDueDate(), borrow.getReturnDate());
        if (lateDays <= 0) {
            return null;
        }

        double fineAmount = lateDays * finePerDay;

        Optional<Fine> existingOpt = fineRepository.findByBorrowId(borrow.getId());
        Fine fine = existingOpt.orElseGet(() -> {
            Fine f = new Fine();
            f.setBorrow(borrow);
            f.setStudent(borrow.getStudent());
            return f;
        });

        fine.setDueDate(borrow.getDueDate());
        fine.setReturnDate(borrow.getReturnDate());
        fine.setLateDays(lateDays);
        fine.setFinePerDay(finePerDay);
        fine.setFineAmount(fineAmount);

        if (fine.getFineStatus() == null) {
            fine.setFineStatus(Fine.FineStatus.UNPAID);
        }

        return fineRepository.save(fine);
    }
}
