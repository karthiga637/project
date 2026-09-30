package com.smartloan;
import java.sql.*;
public class CheckBM5 {
    public static void main(String[] args) {
        try (Connection con = DBConnection.getConnection()) {
            ResultSet rs = con.createStatement().executeQuery("SELECT * FROM customers WHERE email = 'gopimaharajan637@gmail.com'");
            if (!rs.isBeforeFirst()) {
                System.out.println("No user found with email gopimaharajan637@gmail.com");
            }
            while(rs.next()) { 
                System.out.println("ID: " + rs.getInt("id") + " | First: " + rs.getString("first_name") + " | Last: " + rs.getString("last_name") + " | Email: " + rs.getString("email") + " | Password: " + rs.getString("password") + " | Role: " + rs.getString("role")); 
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
