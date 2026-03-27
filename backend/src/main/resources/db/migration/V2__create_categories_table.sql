-- V2__create_categories_table.sql
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_category_name UNIQUE (name)
);

-- Insert default categories
INSERT INTO categories (name, description, display_order, is_active) VALUES
('Technology', 'Books related to technology and computing', 1, TRUE),
('Academic', 'Academic and educational books', 2, TRUE),
('Science', 'Scientific books and publications', 3, TRUE),
('Literature', 'Literature and fiction books', 4, TRUE),
('History', 'Historical books and publications', 5, TRUE);

-- Add condition column to books table for inventory tracking
ALTER TABLE books ADD COLUMN IF NOT EXISTS condition VARCHAR(50) DEFAULT 'NEW';

-- Create book_conditions table for tracking inventory conditions
CREATE TABLE IF NOT EXISTS book_conditions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id BIGINT NOT NULL,
    condition_name VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);
