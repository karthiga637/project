package com.smartloan;

import java.sql.Connection;
import java.sql.Statement;

public class Cleanup {
    public static void main(String[] args) {
        try (Connection con = DBConnection.getConnection();
             Statement stmt = con.createStatement()) {
            
            stmt.execute("DELETE FROM emi_schedule WHERE loan_id IN (8, 9)");
            stmt.execute("DELETE FROM loans WHERE id IN (8, 9)");
            
            System.out.println("Cleaned up loans 8 and 9!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
