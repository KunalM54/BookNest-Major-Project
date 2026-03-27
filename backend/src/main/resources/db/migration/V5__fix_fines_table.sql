-- V5: Fix fines table schema
-- Drop and recreate with clean, normalized schema

DROP TABLE IF EXISTS fines;

CREATE TABLE fines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    borrow_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    late_days INT NOT NULL,
    fine_per_day DOUBLE NOT NULL,
    fine_amount DOUBLE NOT NULL,
    fine_status ENUM('PAID', 'UNPAID') NOT NULL DEFAULT 'UNPAID',
    payment_id BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    UNIQUE KEY uk_fines_borrow_id (borrow_id),
    INDEX idx_fines_student_id (student_id),
    INDEX idx_fines_fine_status (fine_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
