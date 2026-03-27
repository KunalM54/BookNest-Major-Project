package com.booknest.backend.service;

import com.booknest.backend.model.Book;
import com.booknest.backend.model.Borrow;
import com.booknest.backend.model.User;
import com.booknest.backend.repository.BookRepository;
import com.booknest.backend.repository.BorrowRepository;
import com.booknest.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BorrowService {

    @Autowired
    private BorrowRepository borrowRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FineService fineService;

    @Autowired
    private AvailabilityAlertService availabilityAlertService;

    // Get all borrow requests
    public List<Borrow> getAllRequests() {
        return borrowRepository.findAllByOrderByRequestDateDesc();
    }

    // Get pending requests
    public List<Borrow> getPendingRequests() {
        return borrowRepository.findByStatusOrderByRequestDateDesc(Borrow.BorrowStatus.PENDING);
    }

    // Get requests by status
    public List<Borrow> getRequestsByStatus(Borrow.BorrowStatus status) {
        return borrowRepository.findByStatusOrderByRequestDateDesc(status);
    }

    // Create new borrow request
    @Transactional
    public Map<String, Object> createRequest(Long studentId, Long bookId) {
        Map<String, Object> response = new HashMap<>();

        Optional<User> studentOpt = userRepository.findById(studentId);
        Optional<Book> bookOpt = bookRepository.findById(bookId);

        if (!studentOpt.isPresent()) {
            response.put("success", false);
            response.put("message", "Student not found");
            return response;
        }

        if (!bookOpt.isPresent()) {
            response.put("success", false);
            response.put("message", "Book not found");
            return response;
        }

        User student = studentOpt.get();
        Book book = bookOpt.get();

        if (borrowRepository.existsByStudentIdAndBookIdAndStatusIn(
                student.getId(),
                book.getId(),
                List.of(Borrow.BorrowStatus.APPROVED, Borrow.BorrowStatus.OVERDUE))) {
            response.put("success", false);
            response.put("message", "You already borrowed this book and have not returned it");
            return response;
        }

        if (borrowRepository.existsByStudentIdAndBookIdAndStatusIn(
                student.getId(),
                book.getId(),
                List.of(Borrow.BorrowStatus.PENDING))) {
            response.put("success", false);
            response.put("message", "A request for this book is already pending");
            return response;
        }

        if (!student.isActive()) {
            response.put("success", false);
            response.put("message", "Student account is blocked");
            return response;
        }

        if (book.getAvailableCopies() <= 0) {
            response.put("success", false);
            response.put("message", "No available copies");
            return response;
        }

        Borrow borrow = new Borrow();
        borrow.setStudent(student);
        borrow.setBook(book);
        borrow.setRequestDate(LocalDate.now());
        borrow.setStatus(Borrow.BorrowStatus.PENDING);

        borrowRepository.save(borrow);

        response.put("success", true);
        response.put("message", "Borrow request created successfully");
        response.put("borrow", borrow);
        return response;
    }

    // Approve borrow request
    @Transactional
    public Map<String, Object> approveRequest(Long id) {
        Map<String, Object> response = new HashMap<>();

        Optional<Borrow> borrowOpt = borrowRepository.findById(id);

        if (!borrowOpt.isPresent()) {
            response.put("success", false);
            response.put("message", "Borrow request not found");
            return response;
        }

        Borrow borrow = borrowOpt.get();

        if (borrow.getStatus() != Borrow.BorrowStatus.PENDING) {
            response.put("success", false);
            response.put("message", "Request is not pending");
            return response;
        }

        if (borrowRepository.existsByStudentIdAndBookIdAndStatusIn(
                borrow.getStudent().getId(),
                borrow.getBook().getId(),
                List.of(Borrow.BorrowStatus.APPROVED, Borrow.BorrowStatus.OVERDUE))) {
            response.put("success", false);
            response.put("message", "Student already has this book borrowed and not returned");
            return response;
        }

        Book book = borrow.getBook();
        if (book.getAvailableCopies() <= 0) {
            response.put("success", false);
            response.put("message", "No available copies");
            return response;
        }

        // Update book available copies
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        // Notify students waiting for this book
        availabilityAlertService.notifyStudentsWhenAvailable(book.getId());

        // Update borrow status
        borrow.setStatus(Borrow.BorrowStatus.APPROVED);
        borrow.setDueDate(LocalDate.now().plusDays(15)); // 15 days due date
        borrow.setActionDate(LocalDate.now());

        borrowRepository.save(borrow);

        response.put("success", true);
        response.put("message", "Borrow request approved");
        response.put("borrow", borrow);
        return response;
    }

    // Reject borrow request
    @Transactional
    public Map<String, Object> rejectRequest(Long id) {
        Map<String, Object> response = new HashMap<>();

        Optional<Borrow> borrowOpt = borrowRepository.findById(id);

        if (!borrowOpt.isPresent()) {
            response.put("success", false);
            response.put("message", "Borrow request not found");
            return response;
        }

        Borrow borrow = borrowOpt.get();
        borrow.setStatus(Borrow.BorrowStatus.REJECTED);
        borrow.setActionDate(LocalDate.now());
        borrowRepository.save(borrow);

        response.put("success", true);
        response.put("message", "Borrow request rejected");
        response.put("borrow", borrow);
        return response;
    }

    // Return book
    // FIX: Allow returning books with status APPROVED or OVERDUE
    @Transactional
    public Map<String, Object> returnBook(Long id) {
        Map<String, Object> response = new HashMap<>();

        Optional<Borrow> borrowOpt = borrowRepository.findById(id);

        if (!borrowOpt.isPresent()) {
            response.put("success", false);
            response.put("message", "Borrow request not found");
            return response;
        }

        Borrow borrow = borrowOpt.get();

        // FIX: Also allow OVERDUE books to be returned
        if (borrow.getStatus() != Borrow.BorrowStatus.APPROVED
                && borrow.getStatus() != Borrow.BorrowStatus.OVERDUE) {
            response.put("success", false);
            response.put("message", "Cannot return - request not approved");
            return response;
        }

        // Update book available copies
        Book book = borrow.getBook();
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);

        // Update borrow status
        borrow.setStatus(Borrow.BorrowStatus.RETURNED);
        borrow.setReturnDate(LocalDate.now());
        borrow.setActionDate(LocalDate.now());

        // Calculate and persist fine (dynamic rules are handled in FineService)
        var fine = fineService.recalculateAndPersistFineForBorrow(borrow);
        if (fine != null) {
            response.put("fineCreated", true);
            response.put("fineAmount", fine.getFineAmount());
            response.put("lateDays", fine.getLateDays());
            response.put("fine", fine);
        }

        borrowRepository.save(borrow);

        response.put("success", true);
        response.put("message", "Book returned successfully");
        response.put("borrow", borrow);
        return response;
    }

    // Delete/Remove borrow request
    @Transactional
    public Map<String, Object> deleteRequest(Long id) {
        Map<String, Object> response = new HashMap<>();

        if (!borrowRepository.existsById(id)) {
            response.put("success", false);
            response.put("message", "Borrow request not found");
            return response;
        }

        borrowRepository.deleteById(id);

        response.put("success", true);
        response.put("message", "Borrow request removed");
        return response;
    }

    // Get dashboard statistics
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();

        Long totalBooks = bookRepository.count();
        Long totalStudents = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.STUDENT && u.isActive())
                .count();
        Long booksIssued = borrowRepository.countApprovedBorrows();
        Long overdueBooks = borrowRepository.countOverdueBorrows();

        stats.put("totalBooks", totalBooks);
        stats.put("activeMembers", totalStudents);
        stats.put("booksIssued", booksIssued);
        stats.put("overdueBooks", overdueBooks);

        return stats;
    }

    // Get recent borrow requests for dashboard
    public List<Borrow> getRecentRequests(int limit) {
        return borrowRepository.findAllByOrderByRequestDateDesc()
                .stream()
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<Borrow> getMyBooks(Long studentId) {
        return borrowRepository.findMyBooksByStudentId(studentId);
    }

    public List<Borrow> getHistory(Long studentId) {
        return borrowRepository.findHistoryByStudentId(studentId);
    }

    public List<Borrow> getRequests(Long studentId) {
        return borrowRepository.findRequestsByStudentId(studentId);
    }

    public List<Borrow> getRequestsHistory(Long studentId) {
        return borrowRepository.findRequestsHistoryByStudentId(studentId);
    }

    public Map<String, Object> getBookBorrowStatus(Long studentId, Long bookId) {
        Map<String, Object> response = new HashMap<>();

        if (!userRepository.existsById(studentId)) {
            response.put("success", false);
            response.put("message", "Student not found");
            return response;
        }
        if (!bookRepository.existsById(bookId)) {
            response.put("success", false);
            response.put("message", "Book not found");
            return response;
        }

        boolean hasPending = borrowRepository.existsByStudentIdAndBookIdAndStatusIn(
                studentId, bookId, List.of(Borrow.BorrowStatus.PENDING));
        boolean hasActive = borrowRepository.existsByStudentIdAndBookIdAndStatusIn(
                studentId, bookId, List.of(Borrow.BorrowStatus.APPROVED, Borrow.BorrowStatus.OVERDUE));

        Map<String, Object> data = new HashMap<>();
        data.put("hasPending", hasPending);
        data.put("hasActive", hasActive);

        response.put("success", true);
        response.put("message", "Borrow status fetched");
        response.put("data", data);
        return response;
    }

    public byte[] exportHistory(Long studentId, String format) throws Exception {
        List<Borrow> history = borrowRepository.findHistoryByStudentId(studentId);
        User student = userRepository.findById(studentId).orElse(null);
        
        if (format.equalsIgnoreCase("pdf")) {
            return generatePdf(history, student);
        } else {
            return generateCsv(history, student);
        }
    }

    private byte[] generateCsv(List<Borrow> history, User student) {
        StringBuilder csv = new StringBuilder();
        csv.append("Book Title,Author,ISBN,Borrow Date,Due Date,Return Date,Status\n");
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        
        for (Borrow b : history) {
            csv.append("\"").append(b.getBook().getTitle()).append("\",");
            csv.append("\"").append(b.getBook().getAuthor()).append("\",");
            csv.append("\"").append(b.getBook().getIsbn()).append("\",");
            csv.append(b.getRequestDate() != null ? b.getRequestDate().format(formatter) : "").append(",");
            csv.append(b.getDueDate() != null ? b.getDueDate().format(formatter) : "").append(",");
            csv.append(b.getReturnDate() != null ? b.getReturnDate().format(formatter) : "").append(",");
            csv.append("\"").append(b.getDisplayStatus()).append("\"\n");
        }
        
        return csv.toString().getBytes();
    }

    private byte[] generatePdf(List<Borrow> history, User student) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        
        com.itextpdf.text.Document document = new com.itextpdf.text.Document();
        com.itextpdf.text.pdf.PdfWriter.getInstance(document, out);
        document.open();
        
        com.itextpdf.text.Font titleFont = new com.itextpdf.text.Font(com.itextpdf.text.Font.FontFamily.HELVETICA, 18, com.itextpdf.text.Font.BOLD);
        com.itextpdf.text.Font headerFont = new com.itextpdf.text.Font(com.itextpdf.text.Font.FontFamily.HELVETICA, 12, com.itextpdf.text.Font.BOLD);
        com.itextpdf.text.Font normalFont = new com.itextpdf.text.Font(com.itextpdf.text.Font.FontFamily.HELVETICA, 10, com.itextpdf.text.Font.NORMAL);
        
        document.add(new com.itextpdf.text.Paragraph("Borrow History Report", titleFont));
        document.add(new com.itextpdf.text.Paragraph(" "));
        if (student != null) {
            document.add(new com.itextpdf.text.Paragraph("Student: " + student.getFullName(), normalFont));
            document.add(new com.itextpdf.text.Paragraph("Email: " + student.getEmail(), normalFont));
            document.add(new com.itextpdf.text.Paragraph(" "));
        }
        
        com.itextpdf.text.pdf.PdfPTable table = new com.itextpdf.text.pdf.PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{3f, 2f, 2f, 2f, 2f});
        
        String[] headers = {"Book Title", "Borrow Date", "Due Date", "Return Date", "Status"};
        for (String header : headers) {
            com.itextpdf.text.pdf.PdfPCell cell = new com.itextpdf.text.pdf.PdfPCell(new com.itextpdf.text.Phrase(header, headerFont));
            cell.setBackgroundColor(new com.itextpdf.text.BaseColor(220, 220, 220));
            table.addCell(cell);
        }
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        
        for (Borrow b : history) {
            table.addCell(new com.itextpdf.text.Phrase(b.getBook().getTitle(), normalFont));
            table.addCell(new com.itextpdf.text.Phrase(b.getRequestDate() != null ? b.getRequestDate().format(formatter) : "-", normalFont));
            table.addCell(new com.itextpdf.text.Phrase(b.getDueDate() != null ? b.getDueDate().format(formatter) : "-", normalFont));
            table.addCell(new com.itextpdf.text.Phrase(b.getReturnDate() != null ? b.getReturnDate().format(formatter) : "-", normalFont));
            table.addCell(new com.itextpdf.text.Phrase(b.getDisplayStatus(), normalFont));
        }
        
        document.add(table);
        document.close();
        
        return out.toByteArray();
    }

    public byte[] exportAllHistory(String format) throws Exception {
        List<Borrow> allBorrows = borrowRepository.findAll();
        List<Borrow> returned = allBorrows.stream()
                .filter(b -> b.getStatus() == Borrow.BorrowStatus.RETURNED)
                .collect(Collectors.toList());
        
        if (format.equalsIgnoreCase("pdf")) {
            return generatePdf(returned, null);
        } else {
            return generateCsv(returned, null);
        }
    }
}
