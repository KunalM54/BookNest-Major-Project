package com.booknest.backend.scheduler;

import com.booknest.backend.model.Borrow;
import com.booknest.backend.model.Fine;
import com.booknest.backend.repository.BorrowRepository;
import com.booknest.backend.repository.FineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class FineScheduler {

    @Autowired
    private BorrowRepository borrowRepository;

    @Autowired
    private FineRepository fineRepository;

    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void updateOverdueStatus() {
        List<Borrow> approvedBorrows = borrowRepository.findByStatus(Borrow.BorrowStatus.APPROVED);
        
        for (Borrow borrow : approvedBorrows) {
            if (borrow.getDueDate() != null && LocalDate.now().isAfter(borrow.getDueDate())) {
                borrow.setStatus(Borrow.BorrowStatus.OVERDUE);
                borrowRepository.save(borrow);
            }
        }
    }

    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void calculateOverdueFines() {
        List<Borrow> returnedBorrows = borrowRepository.findByStatus(Borrow.BorrowStatus.RETURNED);
        
        for (Borrow borrow : returnedBorrows) {
            if (borrow.getDueDate() != null && borrow.getReturnDate() != null) {
                if (borrow.getReturnDate().isAfter(borrow.getDueDate())) {
                    long daysOverdue = ChronoUnit.DAYS.between(borrow.getDueDate(), borrow.getReturnDate());
                    
                    boolean existingFine = fineRepository.findAll().stream()
                        .anyMatch(f -> f.getBorrow().getId().equals(borrow.getId()));
                    
                    if (!existingFine && daysOverdue > 0) {
                        double finePerDay = 30.0;
                        double fineAmount = daysOverdue * finePerDay;
                        
                        Fine fine = new Fine(borrow.getStudent(), borrow, (int) daysOverdue, finePerDay);
                        fine.setFineAmount(fineAmount);
                        fineRepository.save(fine);
                    }
                }
            }
        }
    }
}
