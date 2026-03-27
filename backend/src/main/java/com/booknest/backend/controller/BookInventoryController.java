package com.booknest.backend.controller;

import com.booknest.backend.model.BookInventory;
import com.booknest.backend.service.BookInventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
public class BookInventoryController {
    
    @Autowired
    private BookInventoryService inventoryService;

    @GetMapping("/book/{bookId}")
    public ResponseEntity<Map<String, Object>> getBookInventory(@PathVariable Long bookId) {
        Map<String, Object> result = inventoryService.getBookInventory(bookId);
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/book/{bookId}/list")
    public ResponseEntity<List<BookInventory>> getInventoryList(@PathVariable Long bookId) {
        List<BookInventory> inventory = inventoryService.getInventoryByBookId(bookId);
        return ResponseEntity.ok(inventory);
    }

    @PostMapping("/book/{bookId}")
    public ResponseEntity<Map<String, Object>> updateInventory(
            @PathVariable Long bookId,
            @RequestParam String condition,
            @RequestParam Integer quantity) {
        Map<String, Object> result = inventoryService.updateInventory(bookId, condition, quantity);
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    @PutMapping("/book/{bookId}/bulk")
    public ResponseEntity<Map<String, Object>> updateMultipleInventory(
            @PathVariable Long bookId,
            @RequestBody Map<String, Integer> conditions) {
        Map<String, Object> result = inventoryService.updateMultipleInventory(bookId, conditions);
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }
}
