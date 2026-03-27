package com.booknest.backend.service;

import com.booknest.backend.model.Borrow;
import com.booknest.backend.repository.BorrowRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class EmailReminderScheduler {

    private static final Logger logger = LoggerFactory.getLogger(EmailReminderScheduler.class);

    @Autowired
    private BorrowRepository borrowRepository;

    @Autowired
    private EmailService emailService;

    @Scheduled(cron = "0 0 9 * * ?")
    @Transactional
    public void sendDueTomorrowReminders() {
        logger.info("Starting due tomorrow reminder job at {}", LocalDateTime.now());
        
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        
        var borrows = borrowRepository.findBorrowsDueTomorrowWithoutEmailSent(tomorrow);
        
        logger.info("Found {} borrows due tomorrow that need reminders", borrows.size());
        
        int successCount = 0;
        int failCount = 0;
        
        for (Borrow borrow : borrows) {
            try {
                boolean sent = emailService.sendDueTomorrowReminderEmail(borrow);
                
                if (sent) {
                    borrow.setEmailSent(true);
                    borrowRepository.save(borrow);
                    successCount++;
                    logger.info("Sent due tomorrow reminder for borrow ID: {}, user: {}", 
                        borrow.getId(), borrow.getStudent().getEmail());
                } else {
                    failCount++;
                    logger.warn("Failed to send reminder for borrow ID: {}", borrow.getId());
                }
            } catch (Exception e) {
                failCount++;
                logger.error("Exception sending reminder for borrow ID {}: {}", 
                    borrow.getId(), e.getMessage());
            }
        }
        
        logger.info("Due tomorrow reminder job completed. Success: {}, Failed: {}", successCount, failCount);
    }

    @Transactional
    public int processAllDueTomorrowReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        
        var borrows = borrowRepository.findBorrowsDueTomorrowWithoutEmailSent(tomorrow);
        
        int count = 0;
        for (Borrow borrow : borrows) {
            try {
                boolean sent = emailService.sendDueTomorrowReminderEmail(borrow);
                if (sent) {
                    borrow.setEmailSent(true);
                    borrowRepository.save(borrow);
                    count++;
                }
            } catch (Exception e) {
                logger.error("Failed to send reminder for borrow {}: {}", borrow.getId(), e.getMessage());
            }
        }
        return count;
    }
}
