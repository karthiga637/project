USE smartloan;

DROP TABLE IF EXISTS emi_schedule;
DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS loan;

CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    mobile VARCHAR(15),
    password VARCHAR(255),
    role VARCHAR(50) DEFAULT 'Customer',
    address TEXT,
    occupation VARCHAR(100),
    monthly_income DOUBLE,
    preferred_loan_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    loan_type VARCHAR(50),
    loan_amount DOUBLE,
    interest_rate DOUBLE,
    tenure_months INT,
    start_date DATE,
    status VARCHAR(50) DEFAULT 'Pending',
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE emi_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT,
    emi_date DATE,
    emi_amount DOUBLE,
    status VARCHAR(50) DEFAULT 'Pending',
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);

INSERT INTO customers (first_name, last_name, email, password, role) 
VALUES ('System', 'Admin', 'admin@smartloan.com', 'admin123', 'Admin');
