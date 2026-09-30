package com.smartloan;

import java.sql.Connection;
import java.sql.Statement;

public class UpdateExistingCustomersBranch {
    public static void main(String[] args) {
        try (Connection con = DBConnection.getConnection();
             Statement stmt = con.createStatement()) {
            
            System.out.println("Updating existing customers with default branch name...");
            int rows = stmt.executeUpdate("UPDATE customers SET branch_name = 'Madurai - KK Nagar Branch' WHERE role = 'Customer' AND (branch_name IS NULL OR branch_name = '')");
            System.out.println("Successfully updated " + rows + " existing customer records!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
