package com.booknest.backend.service;

import com.booknest.backend.model.Category;
import com.booknest.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CategoryService {
    
    @Autowired
    private CategoryRepository categoryRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc();
    }

    public List<Category> getActiveCategories() {
        return categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
    }

    public Map<String, Object> getCategoryById(Long id) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<Category> category = categoryRepository.findById(id);
        if (!category.isPresent()) {
            response.put("success", false);
            response.put("message", "Category not found");
            return response;
        }
        
        response.put("success", true);
        response.put("message", "Category fetched");
        response.put("data", category.get());
        return response;
    }

    @Transactional
    public Map<String, Object> createCategory(String name, String description, Integer displayOrder) {
        Map<String, Object> response = new HashMap<>();
        
        if (name == null || name.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Category name is required");
            return response;
        }
        
        if (categoryRepository.existsByName(name.trim())) {
            response.put("success", false);
            response.put("message", "Category already exists");
            return response;
        }
        
        Category category = new Category();
        category.setName(name.trim());
        category.setDescription(description);
        category.setDisplayOrder(displayOrder != null ? displayOrder : 0);
        category.setIsActive(true);
        
        Category saved = categoryRepository.save(category);
        
        response.put("success", true);
        response.put("message", "Category created successfully");
        response.put("data", saved);
        return response;
    }

    @Transactional
    public Map<String, Object> updateCategory(Long id, String name, String description, Integer displayOrder, Boolean isActive) {
        Map<String, Object> response = new HashMap<>();
        
        Optional<Category> existing = categoryRepository.findById(id);
        if (!existing.isPresent()) {
            response.put("success", false);
            response.put("message", "Category not found");
            return response;
        }
        
        Category category = existing.get();
        
        if (name != null && !name.trim().isEmpty()) {
            Optional<Category> duplicate = categoryRepository.findAll().stream()
                    .filter(c -> c.getName().equalsIgnoreCase(name.trim()) && !c.getId().equals(id))
                    .findFirst();
            
            if (duplicate.isPresent()) {
                response.put("success", false);
                response.put("message", "Category name already exists");
                return response;
            }
            
            category.setName(name.trim());
        }
        
        if (description != null) {
            category.setDescription(description);
        }
        
        if (displayOrder != null) {
            category.setDisplayOrder(displayOrder);
        }
        
        if (isActive != null) {
            category.setIsActive(isActive);
        }
        
        Category saved = categoryRepository.save(category);
        
        response.put("success", true);
        response.put("message", "Category updated successfully");
        response.put("data", saved);
        return response;
    }

    @Transactional
    public Map<String, Object> deleteCategory(Long id) {
        Map<String, Object> response = new HashMap<>();
        
        if (!categoryRepository.existsById(id)) {
            response.put("success", false);
            response.put("message", "Category not found");
            return response;
        }
        
        categoryRepository.deleteById(id);
        
        response.put("success", true);
        response.put("message", "Category deleted successfully");
        return response;
    }
}
