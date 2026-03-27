package com.booknest.backend.service;

import com.booknest.backend.model.Borrow;
import com.booknest.backend.model.Book;
import com.booknest.backend.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    public boolean sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@booknest.com");
            message.setTo(toEmail);
            message.setSubject("BookNest Password Reset OTP");
            message.setText(buildOtpEmailBody(otp));

            mailSender.send(message);
            logger.info("OTP email sent successfully to: {}", toEmail);
            return true;
        } catch (MailException e) {
            logger.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    public boolean sendOverdueReminderEmail(Borrow borrow) {
        try {
            String studentEmail = borrow.getStudent().getEmail();
            String studentName = borrow.getStudent().getFullName();
            String bookTitle = borrow.getBook().getTitle();
            LocalDate dueDate = borrow.getDueDate();
            LocalDate today = LocalDate.now();
            long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(dueDate, today);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@booknest.com");
            message.setTo(studentEmail);
            message.setSubject("Overdue Book Reminder - " + bookTitle);
            message.setText(buildOverdueReminderBody(studentName, bookTitle, dueDate, daysOverdue));

            mailSender.send(message);
            logger.info("Overdue reminder email sent to: {}", studentEmail);
            return true;
        } catch (MailException e) {
            logger.error("Failed to send overdue reminder to {}: {}", 
                borrow.getStudent().getEmail(), e.getMessage());
            return false;
        }
    }

    public boolean sendDueSoonReminderEmail(Borrow borrow, long daysUntilDue) {
        try {
            String studentEmail = borrow.getStudent().getEmail();
            String studentName = borrow.getStudent().getFullName();
            String bookTitle = borrow.getBook().getTitle();
            LocalDate dueDate = borrow.getDueDate();

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@booknest.com");
            message.setTo(studentEmail);
            message.setSubject("Due Soon: " + bookTitle + " - " + daysUntilDue + " day(s) left");
            message.setText(buildDueSoonReminderBody(studentName, bookTitle, dueDate, daysUntilDue));

            mailSender.send(message);
            logger.info("Due soon reminder email sent to: {}", studentEmail);
            return true;
        } catch (MailException e) {
            logger.error("Failed to send due soon reminder to {}: {}", 
                borrow.getStudent().getEmail(), e.getMessage());
            return false;
        }
    }

    public boolean sendAvailabilityAlertEmail(User student, Book book) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@booknest.com");
            message.setTo(student.getEmail());
            message.setSubject("Book Available: " + book.getTitle());
            message.setText(buildAvailabilityAlertBody(student.getFullName(), book.getTitle()));

            mailSender.send(message);
            logger.info("Availability alert email sent to: {}", student.getEmail());
            return true;
        } catch (MailException e) {
            logger.error("Failed to send availability alert to {}: {}", student.getEmail(), e.getMessage());
            return false;
        }
    }

    private String buildOverdueReminderBody(String studentName, String bookTitle, LocalDate dueDate, long daysOverdue) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
        return """
                Dear %s,
                
                This is a reminder that your borrowed book "%s" is overdue.
                
                Due Date: %s
                Days Overdue: %d
                
                Please return the book as soon as possible to avoid additional fines.
                
                If you have already returned the book, please ignore this message.
                
                Best regards,
                BookNest Library
                """.formatted(studentName, bookTitle, dueDate.format(formatter), daysOverdue);
    }

    private String buildDueSoonReminderBody(String studentName, String bookTitle, LocalDate dueDate, long daysUntilDue) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
        return """
                Dear %s,
                
                This is a friendly reminder that your borrowed book "%s" is due soon.
                
                Due Date: %s
                Days Remaining: %d
                
                Please make sure to return the book on or before the due date.
                
                Best regards,
                BookNest Library
                """.formatted(studentName, bookTitle, dueDate.format(formatter), daysUntilDue);
    }

    private String buildAvailabilityAlertBody(String studentName, String bookTitle) {
        return """
                Dear %s,
                
                Great news! The book you were waiting for is now available.
                
                Book: %s
                
                Please borrow it before someone else does!
                
                Best regards,
                BookNest Library
                """.formatted(studentName, bookTitle);
    }

    private String buildOtpEmailBody(String otp) {
        return """
                Hello,
                
                You have requested to reset your password for your BookNest account.
                
                Your One-Time Password (OTP) is: %s
                
                This OTP will expire in 10 minutes.
                
                If you did not request this password reset, please ignore this email or contact support.
                
                Best regards,
                BookNest Team
                """.formatted(otp);
    }
}
