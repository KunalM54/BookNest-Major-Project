-- Create orders table for book purchases
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    amount DOUBLE NOT NULL,
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    given_at DATETIME,
    CONSTRAINT fk_orders_student FOREIGN KEY (student_id) REFERENCES users(id),
    CONSTRAINT fk_orders_book FOREIGN KEY (book_id) REFERENCES books(id),
    INDEX idx_orders_student (student_id),
    INDEX idx_orders_book (book_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_stripe_pi (stripe_payment_intent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
