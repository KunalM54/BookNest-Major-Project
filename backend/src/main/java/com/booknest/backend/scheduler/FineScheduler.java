package com.booknest.backend.scheduler;

import com.booknest.backend.model.Borrow;
import com.booknest.backend.repository.BorrowRepository;
import com.booknest.backend.service.FineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class FineScheduler {

    @Autowired
    private BorrowRepository borrowRepository;

    @Autowired
    private FineService fineService;

    @Scheduled(cron = "0 0 0 * * ?")
    public void updateOverdueStatus() {
        List<Borrow> approvedBorrows = borrowRepository.findByStatus(Borrow.BorrowStatus.APPROVED);
        
        for (Borrow borrow : approvedBorrows) {
            if (borrow.getDueDate() != null && LocalDate.now().isAfter(borrow.getDueDate())) {
                borrow.setStatus(Borrow.BorrowStatus.OVERDUE);
                borrowRepository.save(borrow);
            }
        }
    }

    @Scheduled(cron = "0 10 0 * * ?")
    public void recalculateFines() {
        fineService.recalculateAllFines();
    }
}
