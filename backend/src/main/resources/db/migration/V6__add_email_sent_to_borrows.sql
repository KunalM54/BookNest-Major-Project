ALTER TABLE borrows ADD COLUMN email_sent BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_borrows_email_sent ON borrows(email_sent);
CREATE INDEX idx_borrows_due_date_email_sent ON borrows(due_date, email_sent);
