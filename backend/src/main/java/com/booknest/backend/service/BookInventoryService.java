package com.booknest.backend.service;

import com.booknest.backend.model.Book;
import com.booknest.backend.model.BookInventory;
import com.booknest.backend.repository.BookInventoryRepository;
import com.booknest.backend.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class BookInventoryService {
    
    @Autowired
    private BookInventoryRepository inventoryRepository;
    
    @Autowired
    private BookRepository bookRepository;

    public List<BookInventory> getInventoryByBookId(Long bookId) {
        return inventoryRepository.findByBookIdOrderByConditionNameAsc(bookId);
    }

    public Map<String, Object> getBookInventory(Long bookId) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<Book> book = bookRepository.findById(bookId);
        if (!book.isPresent()) {
            response.put("success", false);
            response.put("message", "Book not found");
            return response;
        }
        
        List<BookInventory> inventory = inventoryRepository.findByBookIdOrderByConditionNameAsc(bookId);
        
        int totalCondition = inventory.stream().mapToInt(BookInventory::getQuantity).sum();
        
        Map<String, Object> data = new HashMap<>();
        data.put("book", book.get());
        data.put("inventory", inventory);
        data.put("totalQuantity", totalCondition);
        
        response.put("success", true);
        response.put("message", "Inventory fetched");
        response.put("data", data);
        return response;
    }

    @Transactional
    public Map<String, Object> updateInventory(Long bookId, String conditionName, Integer quantity) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<Book> book = bookRepository.findById(bookId);
        if (!book.isPresent()) {
            response.put("success", false);
            response.put("message", "Book not found");
            return response;
        }
        
        if (!isValidCondition(conditionName)) {
            response.put("success", false);
            response.put("message", "Invalid condition. Use: NEW, GOOD, DAMAGED, LOST");
            return response;
        }
        
        BookInventory inventory = inventoryRepository
                .findByBookIdAndConditionName(bookId, conditionName)
                .orElseGet(() -> {
                    BookInventory inv = new BookInventory();
                    inv.setBook(book.get());
                    inv.setConditionName(conditionName);
                    inv.setQuantity(0);
                    return inv;
                });
        
        inventory.setQuantity(quantity);
        BookInventory saved = inventoryRepository.save(inventory);
        
        response.put("success", true);
        response.put("message", "Inventory updated");
        response.put("data", saved);
        return response;
    }

    @Transactional
    public Map<String, Object> updateMultipleInventory(Long bookId, Map<String, Integer> conditions) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<Book> book = bookRepository.findById(bookId);
        if (!book.isPresent()) {
            response.put("success", false);
            response.put("message", "Book not found");
            return response;
        }
        
        for (Map.Entry<String, Integer> entry : conditions.entrySet()) {
            String conditionName = entry.getKey();
            Integer quantity = entry.getValue();
            
            if (!isValidCondition(conditionName)) continue;
            
            BookInventory inventory = inventoryRepository
                    .findByBookIdAndConditionName(bookId, conditionName)
                    .orElseGet(() -> {
                        BookInventory inv = new BookInventory();
                        inv.setBook(book.get());
                        inv.setConditionName(conditionName);
                        inv.setQuantity(0);
                        return inv;
                    });
            
            inventory.setQuantity(quantity != null ? quantity : 0);
            inventoryRepository.save(inventory);
        }
        
        response.put("success", true);
        response.put("message", "Inventory updated successfully");
        return response;
    }

    private boolean isValidCondition(String condition) {
        return condition != null && (
            condition.equalsIgnoreCase("NEW") || 
            condition.equalsIgnoreCase("GOOD") || 
            condition.equalsIgnoreCase("DAMAGED") || 
            condition.equalsIgnoreCase("LOST")
        );
    }
}
