package com.booknest.backend.scheduler;

import com.booknest.backend.model.Borrow;
import com.booknest.backend.repository.BorrowRepository;
import com.booknest.backend.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
public class ReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(ReminderScheduler.class);

    @Autowired
    private BorrowRepository borrowRepository;

    @Autowired
    private EmailService emailService;

    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional
    public void sendDueSoonReminders() {
        logger.info("Running due soon reminder scheduler...");
        
        LocalDate today = LocalDate.now();
        LocalDate threeDaysFromNow = today.plusDays(3);
        
        List<Borrow> upcomingBorrows = borrowRepository.findByStatusAndDueDateBetween(
                Borrow.BorrowStatus.APPROVED, today, threeDaysFromNow);
        
        for (Borrow borrow : upcomingBorrows) {
            LocalDate dueDate = borrow.getDueDate();
            long daysUntilDue = java.time.temporal.ChronoUnit.DAYS.between(today, dueDate);
            
            if (daysUntilDue > 0 && daysUntilDue <= 3) {
                try {
                    emailService.sendDueSoonReminderEmail(borrow, daysUntilDue);
                } catch (Exception e) {
                    logger.error("Failed to send due soon reminder for borrow {}: {}", 
                            borrow.getId(), e.getMessage());
                }
            }
        }
        
        logger.info("Due soon reminders sent for {} borrows", upcomingBorrows.size());
    }

    @Scheduled(cron = "0 0 9 * * ?")
    @Transactional
    public void sendOverdueReminders() {
        logger.info("Running overdue reminder scheduler...");
        
        LocalDate today = LocalDate.now();
        
        List<Borrow> overdueBorrows = borrowRepository.findByStatusAndDueDateBefore(
                Borrow.BorrowStatus.APPROVED, today);
        
        int sentCount = 0;
        for (Borrow borrow : overdueBorrows) {
            try {
                emailService.sendOverdueReminderEmail(borrow);
                sentCount++;
            } catch (Exception e) {
                logger.error("Failed to send overdue reminder for borrow {}: {}", 
                        borrow.getId(), e.getMessage());
            }
        }
        
        logger.info("Overdue reminders sent for {} borrows", sentCount);
    }
}
