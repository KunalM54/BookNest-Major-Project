-- Fix orders table - add missing given_at column
ALTER TABLE orders ADD COLUMN given_at DATETIME AFTER paid_at;
