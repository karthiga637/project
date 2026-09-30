package com.smartloan;
import java.sql.*;

public class AlterTable {
    public static void main(String[] args) {
        try (Connection con = DBConnection.getConnection()) {
            Statement stmt = con.createStatement();
            stmt.execute("ALTER TABLE loans MODIFY status ENUM('Pending', 'Active', 'Completed', 'Defaulted', 'Approved', 'Rejected') DEFAULT 'Pending'");
            System.out.println("TABLE ALTERED");
        } catch (Exception e) { e.printStackTrace(); }
    }
}