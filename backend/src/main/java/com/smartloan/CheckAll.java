package com.smartloan;
import java.sql.*;
public class CheckAll {
    public static void main(String[] args) {
        try (Connection con = DBConnection.getConnection()) {
            ResultSet rs = con.createStatement().executeQuery("SELECT * FROM customers");
            while(rs.next()) { 
                System.out.println("ID: " + rs.getInt("id") + " | Email: " + rs.getString("email") + " | Password: " + rs.getString("password") + " | Role: " + rs.getString("role")); 
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
