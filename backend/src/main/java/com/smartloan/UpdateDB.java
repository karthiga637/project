package com.smartloan;

import java.sql.Connection;
import java.sql.Statement;

public class UpdateDB {
    public static void main(String[] args) {
        try (Connection con = DBConnection.getConnection();
             Statement stmt = con.createStatement()) {
             
            try {
                stmt.execute("ALTER TABLE loans ADD COLUMN bank_name VARCHAR(100) DEFAULT 'Generic Bank'");
            } catch(Exception e) {
                System.out.println("Column bank_name might already exist.");
            }

            stmt.execute("CREATE TABLE IF NOT EXISTS bank_products (" +
                         "id INT AUTO_INCREMENT PRIMARY KEY, " +
                         "bank_name VARCHAR(100), " +
                         "loan_type VARCHAR(100), " +
                         "interest_rate DECIMAL(5,2))");

            stmt.execute("TRUNCATE TABLE bank_products");

            String insert = "INSERT INTO bank_products (bank_name, loan_type, interest_rate) VALUES " +
                            "('HDFC Bank', 'Home Loan', 8.50), " +
                            "('HDFC Bank', 'Personal Loan', 11.00), " +
                            "('HDFC Bank', 'Auto Loan', 9.00), " +
                            "('SBI', 'Home Loan', 8.40), " +
                            "('SBI', 'Personal Loan', 11.20), " +
                            "('SBI', 'Auto Loan', 8.90), " +
                            "('ICICI Bank', 'Home Loan', 8.60), " +
                            "('ICICI Bank', 'Personal Loan', 10.99), " +
                            "('ICICI Bank', 'Auto Loan', 9.10), " +
                            "('Axis Bank', 'Home Loan', 8.75), " +
                            "('Axis Bank', 'Personal Loan', 11.50)";
            stmt.execute(insert);
            System.out.println("Database schema updated successfully!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
