package com.smartloan;

import java.sql.Connection;
import java.sql.Statement;

public class AlterTableAddBranch {
    public static void main(String[] args) {
        try (Connection con = DBConnection.getConnection();
             Statement stmt = con.createStatement()) {
            
            System.out.println("Adding branch_name column to customers table if not exists...");
            try {
                stmt.executeUpdate("ALTER TABLE customers ADD COLUMN branch_name VARCHAR(255) DEFAULT NULL");
                System.out.println("Column branch_name added successfully!");
            } catch (Exception e) {
                System.out.println("Notice: " + e.getMessage());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
