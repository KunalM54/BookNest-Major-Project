CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  book_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_book FOREIGN KEY (book_id) REFERENCES books(id),
  CONSTRAINT fk_reviews_student FOREIGN KEY (student_id) REFERENCES users(id),
  UNIQUE KEY unique_review (book_id, student_id),
  KEY idx_reviews_book_id (book_id),
  KEY idx_reviews_student_id (student_id),
  KEY idx_reviews_created_at (created_at)
);

