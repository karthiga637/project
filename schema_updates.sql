USE smartloan;

-- Create banks table
CREATE TABLE IF NOT EXISTS banks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bank_name VARCHAR(100) NOT NULL UNIQUE
);

-- Insert some default banks
INSERT IGNORE INTO banks (bank_name) VALUES ('Generic Bank'), ('SBI'), ('HDFC'), ('ICICI');

-- Add bank_id to customers
ALTER TABLE customers ADD COLUMN bank_id INT DEFAULT NULL;
ALTER TABLE customers ADD CONSTRAINT fk_customer_bank FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL;

-- Add bank_id to bank_products if not exists, but wait, bank_products already has bank_name. Let's add bank_id
ALTER TABLE bank_products ADD COLUMN bank_id INT DEFAULT NULL;
-- Populate bank_id based on bank_name
UPDATE bank_products bp JOIN banks b ON bp.bank_name = b.bank_name SET bp.bank_id = b.id;
ALTER TABLE bank_products ADD CONSTRAINT fk_product_bank FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE;

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    bank_id INT NOT NULL,
    loan_type VARCHAR(100) NOT NULL,
    status ENUM('New', 'Contacted', 'Approved', 'Rejected') DEFAULT 'New',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
);
