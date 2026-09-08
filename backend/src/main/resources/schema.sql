-- ============================================================
-- Smart Loan Management System - MySQL Database Schema
-- Database: smartloan
-- Run this script in MySQL Workbench or MySQL CLI
-- ============================================================

CREATE DATABASE IF NOT EXISTS smartloan;
USE smartloan;

-- ── Customers Table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    first_name       VARCHAR(100) NOT NULL,
    last_name        VARCHAR(100) NOT NULL,
    email            VARCHAR(150) NOT NULL UNIQUE,
    mobile           VARCHAR(15),
    password         VARCHAR(255),
    address          TEXT,
    occupation       VARCHAR(100),
    monthly_income   DECIMAL(15,2) DEFAULT 0,
    preferred_loan_type VARCHAR(50),
    role             VARCHAR(20) DEFAULT 'Customer',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Loans Table ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loans (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    customer_id         INT NOT NULL,
    loan_type           VARCHAR(50) NOT NULL,
    loan_amount         DECIMAL(15,2) NOT NULL,
    interest_rate       DECIMAL(5,2) NOT NULL,
    tenure_months       INT NOT NULL,
    emi_amount          DECIMAL(15,2) NOT NULL,
    outstanding_balance DECIMAL(15,2) NOT NULL,
    start_date          DATE,
    status              ENUM('Active','Completed','Defaulted','Approved') DEFAULT 'Active',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- ── EMI Schedule Table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emi_schedule (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    loan_id              INT NOT NULL,
    installment_no       INT NOT NULL,
    due_date             DATE NOT NULL,
    emi_amount           DECIMAL(15,2) NOT NULL,
    principal_component  DECIMAL(15,2),
    interest_component   DECIMAL(15,2),
    outstanding_balance  DECIMAL(15,2),
    status               ENUM('Pending','Paid','Overdue') DEFAULT 'Pending',
    paid_date            DATE,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);

-- ── Notifications Table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    title       VARCHAR(200),
    message     TEXT,
    type        ENUM('EMI_Reminder','Risk_Alert','General') DEFAULT 'General',
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- ── Documents Table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    loan_id      INT,
    doc_name     VARCHAR(200),
    doc_type     VARCHAR(50),
    file_path    VARCHAR(500),
    uploaded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);

-- ============================================================
-- Sample Data
-- ============================================================

-- Admin user (password: admin123)
INSERT IGNORE INTO customers (first_name, last_name, email, mobile, password, role)
VALUES ('System', 'Administrator', 'admin@smartloan.com', '9876543210', 'admin123', 'Admin');

-- Sample customers
INSERT IGNORE INTO customers (first_name, last_name, email, mobile, password, address, occupation, monthly_income, preferred_loan_type, role)
VALUES
('Rahul', 'Kumar', 'rahul@example.com', '9876500001', 'password123', '12, MG Road, Bangalore', 'Software Engineer', 85000, 'Personal Loan', 'Customer'),
('Priya', 'Sharma', 'priya@example.com', '9876500002', 'password123', '45, Anna Nagar, Chennai', 'Teacher', 45000, 'Home Loan', 'Customer'),
('Arun', 'Velmurugan', 'arun@example.com', '9876500003', 'password123', '78, T Nagar, Chennai', 'Doctor', 120000, 'Education Loan', 'Customer'),
('Meena', 'Krishnan', 'meena@example.com', '9876500004', 'password123', '23, Juhu, Mumbai', 'Business Owner', 200000, 'Business Loan', 'Customer'),
('Vijay', 'Raj', 'vijay@example.com', '9876500005', 'password123', '56, Koramangala, Bangalore', 'Marketing Manager', 65000, 'Vehicle Loan', 'Customer');

-- Sample loans
INSERT IGNORE INTO loans (customer_id, loan_type, loan_amount, interest_rate, tenure_months, emi_amount, outstanding_balance, start_date, status)
VALUES
(2, 'Personal Loan', 200000, 10.5, 36, 6495.00, 130000, '2024-01-15', 'Active'),
(3, 'Home Loan', 1500000, 8.5, 180, 14751.00, 1200000, '2023-06-20', 'Active'),
(4, 'Education Loan', 450000, 9.0, 60, 9330.00, 250000, '2023-09-10', 'Active'),
(5, 'Business Loan', 800000, 12.0, 48, 21067.00, 0, '2022-01-01', 'Completed'),
(6, 'Vehicle Loan', 500000, 9.5, 60, 10490.00, 350000, '2024-03-01', 'Active');

-- Sample EMI records for Loan 1
INSERT IGNORE INTO emi_schedule (loan_id, installment_no, due_date, emi_amount, principal_component, interest_component, outstanding_balance, status, paid_date)
VALUES
(1, 1, '2024-02-15', 6495.00, 4745.00, 1750.00, 195255.00, 'Paid', '2024-02-14'),
(1, 2, '2024-03-15', 6495.00, 4786.00, 1709.00, 190469.00, 'Paid', '2024-03-13'),
(1, 3, '2024-04-15', 6495.00, 4828.00, 1667.00, 185641.00, 'Paid', '2024-04-14'),
(1, 4, '2024-05-15', 6495.00, 4870.00, 1625.00, 180771.00, 'Paid', '2024-05-15'),
(1, 5, '2024-06-15', 6495.00, 4913.00, 1582.00, 175858.00, 'Paid', '2024-06-14'),
(1, 6, '2024-07-15', 6495.00, 4956.00, 1539.00, 170902.00, 'Paid', '2024-07-15'),
(1, 7, '2024-08-15', 6495.00, 4999.00, 1496.00, 165903.00, 'Paid', '2024-08-14'),
(1, 8, '2024-09-15', 6495.00, 5043.00, 1452.00, 160860.00, 'Paid', '2024-09-15'),
(1, 9, '2024-10-15', 6495.00, 5087.00, 1408.00, 155773.00, 'Paid', '2024-10-13'),
(1, 10, '2024-11-15', 6495.00, 5131.00, 1364.00, 150642.00, 'Paid', '2024-11-14'),
(1, 11, '2024-12-15', 6495.00, 5176.00, 1319.00, 145466.00, 'Paid', '2024-12-15'),
(1, 12, '2025-01-15', 6495.00, 5221.00, 1274.00, 140245.00, 'Paid', '2025-01-14'),
(1, 13, '2025-02-15', 6495.00, 5267.00, 1228.00, 134978.00, 'Paid', '2025-02-13'),
(1, 14, '2025-03-15', 6495.00, 5313.00, 1182.00, 129665.00, 'Paid', '2025-03-15'),
(1, 15, '2025-04-15', 6495.00, 5360.00, 1135.00, 124305.00, 'Paid', '2025-04-14'),
(1, 16, '2025-05-15', 6495.00, 5407.00, 1088.00, 118898.00, 'Paid', '2025-05-15'),
(1, 17, '2025-06-15', 6495.00, 5454.00, 1041.00, 113444.00, 'Paid', '2025-06-14'),
(1, 18, '2025-07-15', 6495.00, 5502.00, 993.00, 107942.00, 'Paid', '2025-07-15'),
(1, 19, '2025-08-15', 6495.00, 5550.00, 945.00, 102392.00, 'Paid', '2025-08-14'),
(1, 20, '2025-09-15', 6495.00, 5598.00, 897.00, 96794.00, 'Paid', '2025-09-15'),
(1, 21, '2025-10-15', 6495.00, 5647.00, 848.00, 91147.00, 'Overdue', NULL),
(1, 22, '2025-11-15', 6495.00, 5696.00, 799.00, 85451.00, 'Overdue', NULL),
(1, 23, '2025-12-15', 6495.00, 5745.00, 750.00, 79706.00, 'Pending', NULL),
(1, 24, '2026-01-15', 6495.00, 5795.00, 700.00, 73911.00, 'Pending', NULL),
(1, 25, '2026-02-15', 6495.00, 5845.00, 650.00, 68066.00, 'Pending', NULL),
(1, 26, '2026-03-15', 6495.00, 5895.00, 600.00, 62171.00, 'Pending', NULL),
(1, 27, '2026-04-15', 6495.00, 5946.00, 549.00, 56225.00, 'Pending', NULL),
(1, 28, '2026-05-15', 6495.00, 5997.00, 498.00, 50228.00, 'Pending', NULL),
(1, 29, '2026-06-15', 6495.00, 6049.00, 446.00, 44179.00, 'Pending', NULL),
(1, 30, '2026-07-15', 6495.00, 6101.00, 394.00, 38078.00, 'Paid', '2026-07-14'),
(1, 31, '2026-08-15', 6495.00, 6153.00, 342.00, 31925.00, 'Pending', NULL),
(1, 32, '2026-09-15', 6495.00, 6206.00, 289.00, 25719.00, 'Pending', NULL),
(1, 33, '2026-10-15', 6495.00, 6260.00, 235.00, 19459.00, 'Pending', NULL),
(1, 34, '2026-11-15', 6495.00, 6313.00, 182.00, 13146.00, 'Pending', NULL),
(1, 35, '2026-12-15', 6495.00, 6368.00, 127.00, 6778.00, 'Pending', NULL),
(1, 36, '2027-01-15', 6495.00, 6778.00, 59.00, 0.00, 'Pending', NULL);

-- Notifications
INSERT IGNORE INTO notifications (customer_id, title, message, type)
VALUES
(2, 'EMI Due Soon', 'Your EMI of ₹6,495 is due on 2026-08-15. Please ensure timely payment.', 'EMI_Reminder'),
(3, 'Overdue EMI Alert', 'Your EMI payment is overdue. Please pay immediately to avoid penalties.', 'Risk_Alert'),
(4, 'Monthly Statement', 'Your loan statement for July 2026 is ready.', 'General');
